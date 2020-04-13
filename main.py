import json
import random
from uuid import UUID, uuid4

from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


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
        "request": request, "ws_url": ws_url})

@app.get("/{game_id}/join")
async def get_ela(request: Request, game_id: UUID):
    ws_url = request.url_for("websocket_player2", game_id=game_id)
    return templates.TemplateResponse("player2.html.jinja2", {
        "request": request, "ws_url": ws_url})

@app.websocket("/ws/{game_id}")
async def websocket_player1(websocket: WebSocket, game_id: UUID):
    await websocket.accept()
    egg_pairs[game_id] = websocket
    while True:
        data = await websocket.receive_json()
        if 'username' in data:
            websocket.username = data['username']
        else:
            raise Exception('Invalid message in websocket')
        player_url = websocket.url_for('get_ela', game_id=game_id)
        await websocket.send_json({'invitation_url': player_url})

@app.websocket("/ws/{game_id}/ela")
async def websocket_player2(websocket: WebSocket, game_id: UUID):
    await websocket.accept()
    websocket_player1 = egg_pairs[game_id]
    name = await websocket.receive_text()

    back, front = calculate_winner(), calculate_winner()
    result1 = {'back': back, 'front': front}
    result2 = {'back': not back, 'front': not front}

    await websocket_player1.send_text(f"{name} joined and result is {result1}")
    await websocket.send_text(
        f"You joined {websocket_player1.username} and result for you is {result2}")
    del egg_pairs[game_id]