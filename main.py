import os
import json
import contextlib
import uvicorn
from contextlib import suppress
import random
from uuid import UUID, uuid4

import sentry_sdk

from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.websockets import WebSocketDisconnect

app = FastAPI()
sentry_sdk.init(os.environ.get('SENTRY_DSN'))


app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


class ErrorCode:
    invalid_game = 'INVALID_GAME'


class GameError(Exception):
    pass


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
# TODO share
# TODO 500 error page base - how to?
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



egg_pairs = {}


@app.get("/")
async def host(request: Request):
    game_id = str(uuid4())
    ws_url = request.url_for("websocket_host", game_id=game_id)
    return templates.TemplateResponse("player.html.jinja2", {
        "request": request, "ws_url": ws_url, "is_host": "true" })


@app.get("/{game_id}/join")
async def join(request: Request, game_id: UUID):
    game_id = str(game_id)
    error = ErrorCode.invalid_game if game_id not in egg_pairs else ''
    if error:
        print(f"In /{game_id}/join: Error game id not in {egg_pairs.keys()}", flush=True)
    opponent_nickname = egg_pairs[game_id]['username'] if not error else ''
    ws_url = request.url_for("websocket_join", game_id=game_id)
    return templates.TemplateResponse("player.html.jinja2", {
        "request": request, "ws_url": ws_url, "is_host": "false" ,
        "opponent_nickname": opponent_nickname, 'error': error})


@app.websocket("/ws/{game_id}")
async def websocket_host(websocket: WebSocket, game_id: UUID):
    await websocket.accept()
    game_id = str(game_id)
    if game_id not in egg_pairs:
        egg_pairs[game_id] = {
            'websocket': websocket,
            'username': None,
            'outcome': None
        }
        data = await websocket.receive_json()
        egg_pairs[game_id]['username'] = read_username(data)
        print("In player 1", game_id, egg_pairs[game_id]['username'], flush=True)
        player_url = websocket.url_for('join', game_id=game_id)
        await websocket.send_json({'invitation_url': player_url})
    # To keep socket alive until player2 joins
    with contextlib.suppress(WebSocketDisconnect):
        data = await websocket.receive_json()


@app.websocket("/ws/{game_id}/join")
async def websocket_join(websocket: WebSocket, game_id: UUID):
    game_id = str(game_id)
    await websocket.accept()
    try:
        game = get_game(game_id)
    except GameError:
        await websocket.send_json({'error': ErrorCode.invalid_game})
        await websocket.close()
        return
    print("In player 2: ", game, flush=True)

    data = await websocket.receive_json()
    username = read_username(data)
    back, front = calculate_winner(), calculate_winner()
    game['outcome'] = {'back': back, 'front': front}
    result2 = {'back': not back, 'front': not front}

    await websocket.send_json({'outcome': result2, 'opponent': game['username']})
    await inform_host(game_id, username)


async def inform_host(game_id, opponent):
    try:
        game = egg_pairs[game_id]
    except KeyError:
        return
    websocket = game['websocket']
    with contextlib.suppress(RuntimeError):
        await websocket.send_json({'outcome': game['outcome'], 'opponent': opponent})
    print(f"Removing game id: {game_id}", flush=True)
    del egg_pairs[game_id]


def calculate_winner():
    return bool(random.randint(0, 1))


def read_username(data):
    if not 'username' in data:
        raise Exception('Invalid message in websocket')
    return data['username']


def get_game(game_id):
    try:
        game = egg_pairs[game_id]
    except KeyError:
        print(f"Player 2: Game id: {game_id} not in dict: {egg_pairs.keys()}", flush=True)
        raise GameError('Game invalid')
    if game['outcome']:
        print(f"Player 2: Game id: {game_id} already played: {game}", flush=True)
        raise GameError('Already played')
    return game


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
