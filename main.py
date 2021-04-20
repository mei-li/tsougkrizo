import os
import json
import contextlib
import uvicorn
from cachetools import TTLCache
from contextlib import suppress
from random import choices
from uuid import UUID, uuid4

import sentry_sdk

from enum import Enum
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.websockets import WebSocketDisconnect
from starlette.exceptions import HTTPException as StarletteHTTPException

app = FastAPI()
sentry_sdk.init(os.environ.get('SENTRY_DSN'))


app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


def get_translations():
    locales = ['en', 'el']
    translations = {}

    for locale in locales:
        with open(f'static/i18n/{locale}.json', encoding='utf-8') as f:
            translations[locale] = json.load(f)
        translations[locale]["locale"] = locale

    return translations


translations = get_translations()


def get_locale(request):
    # TODO get locale from url if present
    # TODO get locale from geolocate
    return Locale.default


class Locale(str, Enum):
    greek = "el"
    english = "en"
    default = "en"


class ErrorCode:
    invalid_game = 'INVALID_GAME'


class GameError(Exception):
    pass


@app.exception_handler(StarletteHTTPException)
@app.exception_handler(RequestValidationError)
async def http_exception_handler(request, exc):
    locale = get_locale(request)
    translation = translations.get(locale, Locale.default)

    return templates.TemplateResponse(
        "error.html.jinja2",
        {'request': request, **translation},
        status_code=exc.status_code if hasattr(exc, 'status_code') else 404)


@app.exception_handler(Exception)
async def catch_all_exception_handler(request, exc):
    sentry_sdk.capture_exception(exc)
    raise exc


#############################

# add expiration
# fix urls

# connection issue cases, reload
# stress test

# TODO add redis (expired)
# TODO expired
# TODO multiplayer


# Covered scenarios
# ==================
# Player 1 closes browser
# --- Player 2 joins and plays with a ghost [no errors]
# --- Player 2 joins after key is expired -> message for invalid

# Player 1 looses connection
# ------ Javascript reconnect to same game_id

# Player 2 comes, but game is played with someone else
#                       -> -> message for invalid


class GameManager:
    _games = {}
    _results = TTLCache(10_000, 24 * 60 * 60)

    def gen_game_id(self):
        return str(uuid4())

    def get_game(self, game_id):
        game_id = str(game_id)
        game = None
        with contextlib.suppress(KeyError):
            game = self._games[game_id]
        return game

    def set_game(self, game_id, data):
        game_id = str(game_id)
        self._games[game_id] = data

    def remove_game(self, game_id):
        game_id = str(game_id)
        del self._games[game_id]

    def save_results(self, game_id, results):
        game_id = str(game_id)
        self._results[game_id] = results

    def get_results_for_host(self, game_id):
        game_id = str(game_id)
        return self._results.get(game_id)

    def get_results_for_player(self, game_id):
        game_id = str(game_id)
        results = self._results.get(game_id)
        if results and 'outcome' in results:
            reverse_outcome = {
                'back': not results['outcome']['back'],
                'front': not results['outcome']['front'],
            }
            overrides = {'outcome': reverse_outcome}
            return {**results, **overrides}


game_manager = GameManager()


@app.get("/")
async def host(request: Request):
    # TODO load the language selection page
    locale = get_locale(request)
    return RedirectResponse(url=f'/{locale}')


@app.get("/{locale}/")
async def host(request: Request, locale: Locale):
    translation = translations.get(locale, Locale.default)
    game_id = game_manager.gen_game_id()
    ws_url = request.url_for("websocket_host", game_id=game_id, locale=locale.value)
    kk = {
        "request": request, "ws_url": ws_url, "is_host": "true",
        **translation}
    return templates.TemplateResponse("player.html.jinja2", kk)


@app.get("/{locale}/{game_id}/join")
async def join(request: Request, game_id: UUID, locale: Locale):
    translation = translations.get(locale, Locale.default)
    game = game_manager.get_game(game_id)
    results = game_manager.get_results_for_player(game_id)
    error = ''
    if not game and not results:
        error = ErrorCode.invalid_game
    template = "player.html.jinja2" if not results else "result.html.jinja2"
    return templates.TemplateResponse(template, {
        "request": request,
        "ws_url": request.url_for("websocket_join", game_id=game_id, locale=locale.value),
        "is_host": "false",
        "opponent_nickname": game['username'] if game else '',
        "error": error,
        "result": json.dumps(results) if results else "",
        **translation
        })


@app.websocket("/ws/{locale}/{game_id}")
async def websocket_host(websocket: WebSocket, game_id: UUID, locale: Locale):
    await websocket.accept()
    game = game_manager.get_game(game_id)
    results = game_manager.get_results_for_host(game_id)
    if not game and not results:
        game = {
            'websocket': websocket,
            'username': None,
            'outcome': None
        }
        data = await websocket.receive_json()
        game['username'] = read_username(data)
        print("In player 1", game_id, game['username'], flush=True)
        game_manager.set_game(game_id, game)
        await websocket.send_json({
            'invitation_url': websocket.url_for('join', game_id=game_id, locale=locale.value)
        })
    elif results:
        await websocket.send_json(results)
        return

    # To keep socket alive until player2 joins
    with contextlib.suppress(WebSocketDisconnect):
        data = await websocket.receive_json()


@app.websocket("/ws/{locale}/{game_id}/join")
async def websocket_join(websocket: WebSocket, game_id: UUID):
    await websocket.accept()
    # Verify game is still on
    game = game_manager.get_game(game_id)
    if not game or game['outcome']:  # invalid game or already played
        await websocket.send_json({'error': ErrorCode.invalid_game})
        await websocket.close()
        return
    print("In player 2: ", game, flush=True)

    # Get player name
    data = await websocket.receive_json()
    username = read_username(data)
    back, front = calculate_outcome()
    game['outcome'] = {'back': back, 'front': front}
    result2 = {'back': not back, 'front': not front}

    await websocket.send_json({'outcome': result2, 'opponent': game['username']})
    await inform_host(game, game_id, username, game['username'])


async def inform_host(game, game_id, opponent, host):
    websocket = game['websocket']
    with contextlib.suppress(RuntimeError):
        results = {
            'outcome': game['outcome'],
            'opponent': opponent,
            'host': host
        }
        await websocket.send_json(results)

    game_manager.save_results(game_id, results)
    print(f"Removing game id: {game_id}", flush=True)
    game_manager.remove_game(game_id)


def calculate_outcome():
    population = [(True, True), (True, False), (False, True), (False, False)]
    weights = [0.35, 0.15, 0.15, 0.35]
    return choices(population, weights)[0]


def read_username(data):
    try:
        return data['username']
    except KeyError:
        raise Exception('Invalid message in websocket')


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
