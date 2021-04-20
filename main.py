import os
import json
import contextlib
import uvicorn
from cachetools import TTLCache
from random import choices
from uuid import UUID, uuid4

import sentry_sdk

from fastapi import FastAPI, WebSocket, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.websockets import WebSocketDisconnect
from starlette.exceptions import HTTPException as StarletteHTTPException

import ormar
from persistence import Game, create_game

app = FastAPI()
sentry_sdk.init(os.environ.get('SENTRY_DSN'))


app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


class ErrorCode:
    invalid_game = 'INVALID_GAME'


class GameError(Exception):
    pass


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc):
    return templates.TemplateResponse(
        "error.html.jinja2", {
        "request": request,
        }, status_code=exc.status_code)


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
    _websockets = {}
    _results = TTLCache(10_000, 24 * 60 * 60)

    async def get_game(self, game_id):
        game_id = str(game_id)
        game = None
        # TODO: test with a non existent game
        with contextlib.suppress(ormar.exceptions.NoMatch):
            game = await Game.objects.get(uuid=UUID(game_id))

        return game

    async def update_game(self, game, **kwargs):
        if game:
            if 'websocket' in kwargs:
                self._websocket[game.uuid] = kwargs.pop('websocket')
            await game.update(**kwargs)

    def remove_game(self, game_id):
        game_id = str(game_id)
        del self._games[game_id]

    def save_results(self, game_id, results):
        game_id = str(game_id)
        self._results[game_id] = results

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
    game_id = str(uuid4())

    ws_url = request.url_for("websocket_host", game_id=game_id)
    return templates.TemplateResponse("player.html.jinja2", {
        "request": request, "ws_url": ws_url, "is_host": "true"})


@app.get("/{game_id}/join")
async def join(request: Request, game_id: UUID):
    game = await game_manager.get_game(game_id)
    results = game_manager.get_results_for_player(game_id)
    error = ''
    if not game and not results:
        error = ErrorCode.invalid_game
    template = "player.html.jinja2" if not results else "result.html.jinja2"
    return templates.TemplateResponse(template, {
        "request": request,
        "ws_url": request.url_for("websocket_join", game_id=game_id),
        "is_host": "false",
        "opponent_nickname": game['username'] if game else '',
        "error": error,
        "result": json.dumps(results) if results else "",
        })


@app.websocket("/ws/{game_id}")
async def websocket_host(websocket: WebSocket, game_id: UUID):
    await websocket.accept()
    print("In player 1", 'no game_id', flush=True)
    game = await game_manager.get_game(game_id)
    print("In player 1", game, flush=True)
    if not game:
        data = await websocket.receive_json()
        host = read_username(data)
        game = await create_game(uuid=game_id, host=host)
        print("In player 1", game_id, host, flush=True)
        await game_manager.update_game(game, websocket=websocket)
        await websocket.send_json({
            'invitation_url': websocket.url_for('join', game_id=game.uuid)
        })
    elif game.player:
        await websocket.send_json({'outcome': {'back': game.host_back, 'front': game.host_front}, 'host': game.host, 'opponent': game.player})
        return

    # To keep socket alive until player2 joins
    with contextlib.suppress(WebSocketDisconnect):
        data = await websocket.receive_json()


@app.websocket("/ws/{game_id}/join")
async def websocket_join(websocket: WebSocket, game_id: UUID):
    await websocket.accept()
    # Verify game is still on
    game = await game_manager.get_game(game_id)
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
