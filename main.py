import os
import json
import contextlib
import uvicorn
from cachetools import TTLCache
from random import choices
from uuid import UUID, uuid4

import sentry_sdk

from enum import Enum
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import RedirectResponse
from fastapi.exceptions import RequestValidationError
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.websockets import WebSocketDisconnect
from starlette.exceptions import HTTPException as StarletteHTTPException

import ormar
from persistence import Game, create_game, database

app = FastAPI()
app.state.database = database
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
    _websockets = {}

    async def get_game(self, game_id: UUID):
        game = None
        with contextlib.suppress(ormar.exceptions.NoMatch):
            game = await Game.objects.get(uuid=game_id)
        return game

    async def update_game(self, game, **kwargs):
        if game:
            if 'websocket' in kwargs:
                self._websockets[game.uuid] = kwargs.pop('websocket')
            await game.update(**kwargs)

    def get_websocket(self, game):
        return self._websockets.get(game.uuid)

    def remove_websocket(self, game):
        # TODO test if not present
        del self._websockets[game.uuid]


game_manager = GameManager()


@app.get("/")
async def host(request: Request):
    # TODO load the language selection page
    locale = get_locale(request)
    return RedirectResponse(url=f'/{locale}')


@app.get("/{locale}/")
async def host(request: Request, locale: Locale):
    translation = translations.get(locale, Locale.default)
    game_id = str(uuid4())

    ws_url = request.url_for("websocket_host", game_id=game_id, locale=locale.value)
    return templates.TemplateResponse("player.html.jinja2", {
        "request": request, "ws_url": ws_url, "is_host": "true", 
        **translation})


@app.get("/{locale}/{game_id}/join")
async def join(request: Request, game_id: UUID, locale: Locale):
    translation = translations.get(locale, Locale.default)
    game = await game_manager.get_game(game_id)
    error = ''
    if not game:
        error = ErrorCode.invalid_game
    results = None
    if game and game.player: # game is already played
        # send results from player/opponent perspective
        results = {
            'outcome': {'back': not game.host_back, 'front': not game.host_front},
            'host': game.host,
            'opponent': game.player
            }
    template = "player.html.jinja2" if not results else "result.html.jinja2"
    return templates.TemplateResponse(template, {
        "request": request,
        "ws_url": request.url_for("websocket_join", game_id=game_id, locale=locale.value),
        "is_host": "false",
        "opponent_nickname": game.host if game else '',
        "error": error,
        "result": json.dumps(results) if results else "",
        **translation
        })


@app.websocket("/ws/{locale}/{game_id}")
async def websocket_host(websocket: WebSocket, game_id: UUID, locale: Locale):
    await websocket.accept()
    game = await game_manager.get_game(game_id)
    print("In player 1", game, flush=True)
    if not game or not game.host:
        data = await websocket.receive_json()
        host = read_username(data)
        game = await create_game(uuid=game_id, host=host)
        print("In player 1", game_id, host, flush=True)
        await game_manager.update_game(game, websocket=websocket)

    if game.player:  # game is already played
        # send result from host perspective
        await websocket.send_json({
            'outcome': {'back': game.host_back, 'front': game.host_front},
            'host': game.host,
            'opponent': game.player
            })
        return

    # send the share url
    await websocket.send_json({
            'invitation_url': websocket.url_for('join', game_id=game.uuid, locale=locale.value)
        })

    # To keep socket alive until player2 joins
    with contextlib.suppress(WebSocketDisconnect):
        data = await websocket.receive_json()


@app.websocket("/ws/{locale}/{game_id}/join")
async def websocket_join(websocket: WebSocket, game_id: UUID):
    await websocket.accept()
    # Verify game is still on
    game = await game_manager.get_game(game_id)
    if not game or game.player:  # invalid game or already played
        await websocket.send_json({'error': ErrorCode.invalid_game})
        await websocket.close()
        return
    print("In player 2: ", game, flush=True)

    # Get player name
    data = await websocket.receive_json()
    username = read_username(data)
    back, front = calculate_outcome()
    await game_manager.update_game(game, player=username, host_front=front, host_back=back)

    result_for_player = {'back': not back, 'front': not front}

    await websocket.send_json({'outcome': result_for_player, 'opponent': game.host})
    await inform_host(game)


async def inform_host(game):
    websocket = game_manager.get_websocket(game)
    if websocket:
        with contextlib.suppress(RuntimeError):
            results = {
                'outcome': {'back': game.host_back, 'front': game.host_front},
                'host': game.host,
                'opponent': game.player
            }
            await websocket.send_json(results)
        game_manager.remove_websocket(game)

def calculate_outcome():
    population = [(True, True), (True, False), (False, True), (False, False)]
    weights = [0.35, 0.15, 0.15, 0.35]
    return choices(population, weights)[0]


def read_username(data):
    try:
        return data['username']
    except KeyError:
        raise Exception('Invalid message in websocket')


@app.on_event("startup")
async def startup() -> None:
    database_ = app.state.database
    if not database_.is_connected:
        await database_.connect()


@app.on_event("shutdown")
async def shutdown() -> None:
    database_ = app.state.database
    if database_.is_connected:
        await database_.disconnect()


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
