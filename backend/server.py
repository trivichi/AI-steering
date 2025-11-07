# server.py
import asyncio
import base64
import json
import time
from typing import Dict, Any, Optional

import cv2
import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import your existing classes
from advanced_f1_refactor_with_ai import Config, GameLogic, HandTracker, AIAgent

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_ws: Optional[WebSocket] = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_ws = websocket
        print("✅ Client connected")

    def disconnect(self):
        self.active_ws = None
        print("❌ Client disconnected")

    async def send_json(self, data: dict):
        if self.active_ws:
            try:
                await self.active_ws.send_text(json.dumps(data))
            except Exception as e:
                print(f"Error sending data: {e}")

manager = ConnectionManager()

def normalize_value(obj):
    """Convert numpy types to Python native types for JSON serialization"""
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, (list, tuple)):
        return [normalize_value(x) for x in obj]
    if isinstance(obj, dict):
        return {k: normalize_value(v) for k, v in obj.items()}
    return obj

def build_state_snapshot(
    logic: GameLogic,
    config: Config,
    steering: float,
    hand_detected: bool,
    ai_active: bool,
    cam_frame=None,
    game_over: bool = False
) -> Dict[str, Any]:
    """Build a compact state snapshot to send to frontend"""
    road_left = (config.WIDTH - config.TRACK_WIDTH) // 2
    road_right = road_left + config.TRACK_WIDTH
    
    snapshot = {
        "timestamp": time.time(),
        "gameOver": game_over,
        "car": {
            "x": float(logic.car_x),
            "y": float(logic.car_y),
            "speed": float(logic.car_speed),
            "steering": float(logic.current_steering)
        },
        "input": {
            "steering": float(steering),
            "handDetected": bool(hand_detected),
            "aiActive": bool(ai_active)
        },
        "track": {
            "width": config.WIDTH,
            "height": config.HEIGHT,
            "roadLeft": road_left,
            "roadRight": road_right,
            "linePositions": [float(y) for y in logic.track_lines]
        },
        "obstacles": [
            {
                "x": float(o["x"]),
                "y": float(o["y"]),
                "width": float(o.get("width", 30)),
                "height": float(o.get("height", 40)),
                "type": o["type"]
            }
            for o in logic.obstacles
        ],
        "opponents": [
            {
                "x": float(o["x"]),
                "y": float(o["y"]),
                "speed": float(o.get("speed", 5))
            }
            for o in logic.opponent_cars
        ],
        "powerups": [
            {
                "x": float(p["x"]),
                "y": float(p["y"]),
                "type": p["type"],
                "pulse": float(p.get("pulse", 0))
            }
            for p in logic.power_ups
        ],
        "score": int(logic.score),
        "level": int(logic.level),
        "boostActive": bool(logic.boost_active),
        "invincible": bool(logic.invincible)
    }
    
    # Optional: Add small camera preview as base64 JPEG
    if cam_frame is not None:
        try:
            small = cv2.resize(cam_frame, (160, 120))
            _, jpg = cv2.imencode('.jpg', small, [int(cv2.IMWRITE_JPEG_QUALITY), 40])
            b64 = base64.b64encode(jpg.tobytes()).decode('ascii')
            snapshot['camPreview'] = b64
        except Exception as e:
            print(f"Error encoding camera preview: {e}")
    
    return snapshot

@app.get("/")
async def root():
    return {"message": "F1 Vision Racer Backend", "status": "running"}

@app.websocket("/ws/game")
async def game_websocket(websocket: WebSocket):
    await manager.connect(websocket)
    
    # Initialize game components
    cfg = Config()
    logic = GameLogic(cfg)
    tracker = HandTracker(cfg)
    ai = AIAgent(cfg)
    
    # Camera capture
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        await websocket.send_text(json.dumps({"error": "Cannot open camera"}))
        return
    
    # Game state
    no_hand_start: Optional[float] = None
    ai_active = False
    game_over = False
    
    try:
        print("🎮 Game loop started")
        
        while True:
            # Read camera frame
            ret, cam = cap.read()
            if not ret:
                await asyncio.sleep(0.01)
                continue
            
            cam = cv2.flip(cam, 1)
            
            # Process hand tracking
            steering_input, hand_detected = tracker.process_frame(cam)
            
            # AI takeover logic
            now = time.time()
            if not hand_detected:
                if no_hand_start is None:
                    no_hand_start = now
                elif now - no_hand_start > 1.0:  # 1 second delay
                    ai_active = True
            else:
                no_hand_start = None
                ai_active = False
            
            # AI decision making
            if ai_active:
                steer_decision, throttle = ai.decide(
                    car_x=logic.car_x,
                    car_y=logic.car_y,
                    car_speed=logic.car_speed,
                    obstacles=logic.obstacles,
                    opponents=logic.opponent_cars
                )
                steering_input = steer_decision
                hand_for_physics = throttle
            else:
                hand_for_physics = hand_detected
            
            # Update game logic only if not game over
            if not game_over:
                # Spawning
                logic.spawn_obstacle()
                logic.spawn_opponent()
                logic.spawn_power_up()
                
                # Updates
                logic.update_track_lines()
                logic.update_obstacles()
                
                # AI for opponents
                for opp in logic.opponent_cars:
                    ai.decide_for_opponent(opp, logic.obstacles)
                
                logic.update_opponents()
                logic.update_power_ups()
                logic.update_car_physics(steering_input, hand_for_physics)
                logic.update_game_state()
                
                # Check collisions
                collision = logic.check_collisions()
                if collision:
                    print(f"💥 Collision: {collision}")
                    game_over = True
            
            # Build and send state snapshot
            snapshot = build_state_snapshot(
                logic, cfg, steering_input, hand_detected, ai_active, cam, game_over
            )
            await manager.send_json(snapshot)
            
            # Listen for client messages (restart, etc.)
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=0.001)
                data = json.loads(message)
                
                if data.get("action") == "restart":
                    print("🔄 Restarting game...")
                    logic.restart()
                    game_over = False
                    ai_active = False
                    no_hand_start = None
                elif data.get("action") == "boost":
                    logic.activate_boost()
                    
            except asyncio.TimeoutError:
                pass  # No message received, continue
            except Exception as e:
                pass  # Ignore message errors
            
            # Maintain ~30 FPS
            await asyncio.sleep(1.0 / 30.0)
            
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error in game loop: {e}")
    finally:
        manager.disconnect()
        cap.release()

if __name__ == "__main__":
    print("🚀 Starting F1 Vision Racer Backend Server")
    print("📡 WebSocket endpoint: ws://localhost:8000/ws/game")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")