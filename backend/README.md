# F1 Vision Racer - Backend

Python backend using FastAPI, OpenCV, and MediaPipe for hand tracking and game logic.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run server:
```bash
python server.py
```

Server will start on `http://localhost:8000`
WebSocket endpoint: `ws://localhost:8000/ws/game`

## Controls

- **Hands detected**: Manual steering
- **No hands (1s)**: AI takes over
- **Press 'r'**: Restart game (via WebSocket message)
- **Press 'b'**: Boost (via WebSocket message)