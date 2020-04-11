from uuid import UUID, uuid4
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

htmlela = """
"""

# real win or loose
# add expiration
# fix urls

# connection issue cases, reload
# stress test
egg_pairs = {}


@app.get("/")
async def get(request: Request):
    game_id = str(uuid4())
    ws_url = request.url_for("websocket_player1", game_id=game_id)
    return templates.TemplateResponse("player1.html.jinja2", {
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
        data = await websocket.receive_text()
        if data == 'BYE':
            break
        websocket.username = data
        player_url = websocket.url_for('get_ela', game_id=game_id) 
        await websocket.send_text(
            f'For player 2... <a href="{player_url}" target="_blank">Send to friend</a> send BYE to close socket...')


@app.websocket("/ws/{game_id}/ela")
async def websocket_player2(websocket: WebSocket, game_id: UUID):
    await websocket.accept()
    websocket_player1 = egg_pairs[game_id]
    name = await websocket.receive_text()
    result1 = {'broken': {'back': True, 'front': True}}
    result2 = {'broken': {'back': False, 'front': False}}
    await websocket_player1.send_text(f"{name} joined and result is {result1}")
    await websocket.send_text(
        f"You joined {websocket_player1.username} and result for you is {result2}")
    # TODO remove from dictionary the game