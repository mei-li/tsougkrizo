import os
import json
import uvicorn
from contextlib import suppress
import random
from uuid import UUID, uuid4

import sentry_sdk

from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()
sentry_sdk.init(os.environ.get('SENTRY_DSN'))


app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

class ErrorCode:
    invalid_game = 'INVALID_GAME'

##### Exception handling
@app.exception_handler(Exception)
async def catch_all_exception_handler(request, exc):
    sentry_sdk.capture_exception(exc)
    raise exc

#############################

# add expiration
# fix urls

# connection issue cases, reload
# stress test
egg_pairs = {}


def calculate_winner():
    return bool(random.randint(0, 1))


@app.get("/")
async def get(request: Request):
    game_id = str(uuid4())
    ws_url = request.url_for("websocket_player1", game_id=game_id)
    return templates.TemplateResponse("base01.html.jinja2", {
        "request": request, "ws_url": ws_url, "is_host": "true" })

@app.get("/{game_id}/join")
async def get_ela(request: Request, game_id: UUID):
    game_id = str(game_id)
    error = ErrorCode.invalid_game if game_id not in egg_pairs else ''
    opponent_nickname = egg_pairs[game_id]['username'] if not error else ''
    ws_url = request.url_for("websocket_player2", game_id=game_id)
    return templates.TemplateResponse("base01.html.jinja2", {
        "request": request, "ws_url": ws_url, "is_host": "false" ,
        "opponent_nickname": opponent_nickname, 'error': error})

@app.websocket("/ws/{game_id}")
async def websocket_player1(websocket: WebSocket, game_id: UUID):
    await websocket.accept()
    game_id = str(game_id)
    egg_pairs[game_id] = {
        'websocket': websocket,
        'username': None,
        'outcome': None
    }
    data = await websocket.receive_json()
    egg_pairs[game_id]['username'] = read_username(data)
    print("In player 1", game_id, egg_pairs[game_id]['username'], flush=True)
    player_url = websocket.url_for('get_ela', game_id=game_id)
    await websocket.send_json({'invitation_url': player_url})
    # TO keep socket alive until player2 joins
    data = await websocket.receive_json()

# player 2 joins game is played by sb else
# player 2 joins player 1 is disconnected
# player 2 joins player 1 is not there any more
# TODO sync with Fotis about multiplayer support (only consider)
# TODO sync with Fotis about expired, already played, error page
# TODO for fotis: player 2 name, share button, crashing effect (can it be for many outcomes?), 3 corner cases above

# TODO error page for internal error
# TODO when host's nickname is the same to the guest's nickname

# Player 1 closes browser
# --- Player 2 joins and plays with a ghost [no errors]
# --- Player 2 joins after key is expired -> message for invalid

# Player 1 looses connection
# ------ Javascript reconnect to same game_id

# Player 2 comes, but game is played with someone else

# TODO javascript reconnection

async def inform_player1(game_id, player2):
    try:
        game = egg_pairs[game_id]
    except KeyError:
        return
    websocket = game['websocket']
    # TODO handle disconnect
    await websocket.send_json({'outcome': game['outcome'], 'opponent': player2})
    print("Removing game id")
    del egg_pairs[game_id]

def read_username(data):
    if not 'username' in data:
        raise Exception('Invalid message in websocket')
    return data['username']

class GameError(Exception):
    pass


def get_game(game_id):
    try:
        game = egg_pairs[game_id]
    except KeyError:
        raise GameError('Game invalid')
    if game['outcome']:
        raise GameError('Already played')
    return game

@app.websocket("/ws/{game_id}/ela")
async def websocket_player2(websocket: WebSocket, game_id: UUID):
    game_id = str(game_id)
    await websocket.accept()
    # TODO multiplayer
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
    await inform_player1(game_id, username)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
