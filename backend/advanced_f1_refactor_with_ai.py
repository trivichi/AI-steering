# advanced_f1_refactor_with_ai.py
from __future__ import annotations
import math
import random
import time
from dataclasses import dataclass
from typing import List, Tuple, Optional

import cv2
import mediapipe as mp
import numpy as np

# Optional sound dependency
try:
    import pygame
    pygame.mixer.init()
    SOUND_AVAILABLE = True
except Exception:
    SOUND_AVAILABLE = False

# --------------------------
# Types & Constants
# --------------------------
Point = Tuple[float, float]
Color = Tuple[int, int, int]

@dataclass(frozen=True)
class Config:
    WIDTH: int = 1200
    HEIGHT: int = 800
    TRACK_WIDTH: int = 450
    LINE_GAP: int = 60
    MAX_SPEED: float = 15.0
    ACCELERATION: float = 0.2
    MAX_STEERING: float = 50.0
    HAND_DETECT_CONF: float = 0.7
    HAND_TRACK_CONF: float = 0.5

DEFAULT_COLORS = {
    'road': (45, 45, 45),
    'lines': (255, 255, 255),
    'car': (220, 20, 60),
    'grass': (34, 139, 34),
    'text': (255, 255, 255),
    'steering_wheel': (200, 200, 200),
    'hand_points': (0, 255, 0),
    'obstacle': (139, 69, 19),
    'opponent': (0, 100, 200),
    'boost': (255, 215, 0),
    'danger': (255, 0, 0),
    'power_up': (255, 165, 0)
}

# --------------------------
# Utilities
# --------------------------

def clamp(v: float, a: float, b: float) -> float:
    return max(a, min(b, v))

# --------------------------
# Hand Tracking
# --------------------------
class HandTracker:
    """Encapsulates MediaPipe hand detection and gesture utils."""

    def __init__(self, config: Config, colors: dict = DEFAULT_COLORS) -> None:
        self.config = config
        self.colors = colors
        self.mp_hands = mp.solutions.hands
        self.hands = self.mp_hands.Hands(
            static_image_mode=False,
            max_num_hands=2,
            min_detection_confidence=config.HAND_DETECT_CONF,
            min_tracking_confidence=config.HAND_TRACK_CONF,
        )
        self.drawing = mp.solutions.drawing_utils

    def process_frame(self, frame: np.ndarray) -> Tuple[float, bool]:
        """Process the camera frame and return a steering value and a hand_detected flag.

        Returns:
            (steering_degrees, hand_detected)
        """
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.hands.process(rgb)

        hand_positions: List[Point] = []

        if results.multi_hand_landmarks:
            for landmarks in results.multi_hand_landmarks:
                # draw landmarks on the original frame for visual debugging
                self.drawing.draw_landmarks(
                    frame,
                    landmarks,
                    self.mp_hands.HAND_CONNECTIONS,
                    self.drawing.DrawingSpec(color=self.colors['hand_points'], thickness=2, circle_radius=2),
                    self.drawing.DrawingSpec(color=(0, 255, 255), thickness=2),
                )
                cx, cy = self._get_hand_center(landmarks)
                hand_positions.append((cx * frame.shape[1], cy * frame.shape[0]))

        steering, detected = self._compute_steering(hand_positions, frame.shape)
        return steering, detected

    def _get_hand_center(self, hand_landmarks) -> Point:
        x_coords = [lm.x for lm in hand_landmarks.landmark]
        y_coords = [lm.y for lm in hand_landmarks.landmark]
        return sum(x_coords) / len(x_coords), sum(y_coords) / len(y_coords)

    def _distance(self, p1: Point, p2: Point) -> float:
        return math.hypot(p1[0] - p2[0], p1[1] - p2[1])

    def _compute_steering(self, hand_positions: List[Point], frame_shape: Tuple[int, int, int]) -> Tuple[float, bool]:
        """Return steering degrees (-MAX_STEERING..MAX_STEERING) and whether a hand exists."""
        if len(hand_positions) >= 2:
            left = min(hand_positions, key=lambda p: p[0])
            right = max(hand_positions, key=lambda p: p[0])
            angle = math.atan2(right[1] - left[1], right[0] - left[0])
            steering = math.degrees(angle) * 2.0
            steering = clamp(steering, -self.config.MAX_STEERING, self.config.MAX_STEERING)
            return steering, True

        if len(hand_positions) == 1:
            hx, _ = hand_positions[0]
            center_x = frame_shape[1] / 2
            steering = (hx - center_x) / center_x * self.config.MAX_STEERING
            steering = clamp(steering, -self.config.MAX_STEERING, self.config.MAX_STEERING)
            return steering, True

        return 0.0, False

# --------------------------
# Simple AI Agent
# --------------------------
class AIAgent:


    def __init__(self, config: Config) -> None:
        self.config = config
        # how aggressively AI steers (-1..1)
        self.aggression = 0.9
        # reaction distance for obstacle avoidance
        self.obstacle_avoid_dist = 180
        # keep some memory for smoothing
        self.last_steer = 0.0

    def decide(self, car_x: float, car_y: float, car_speed: float, obstacles: List[dict], opponents: List[dict]) -> Tuple[float, bool]:
        """
        Decide steering (degrees, -MAX_STEERING..MAX_STEERING) and whether AI wants throttle (True/False).
        """
        # default target is center of track
        road_left = (self.config.WIDTH - self.config.TRACK_WIDTH) // 2 + 25
        road_right = road_left + self.config.TRACK_WIDTH - 50
        target_x = (road_left + road_right) / 2

        # slight bias to move forward in middle lane; but if opponent ahead, pick a neighboring X sometimes
        if opponents:
            # find nearest opponent ahead
            ahead = [o for o in opponents if o['y'] < car_y]
            if ahead:
                nearest = min(ahead, key=lambda o: abs(o['y'] - car_y))
                # choose to overtake by offsetting left/right
                offset = -40 if nearest['x'] > car_x else 40
                target_x = clamp(nearest['x'] + offset, road_left, road_right)

        # obstacle avoidance: detect close obstacles ahead and shift target_x away
        for o in obstacles:
            dy = o['y'] - car_y
            dx = o['x'] - car_x
            if 0 < dy < self.obstacle_avoid_dist and abs(dx) < 140:
                # shift target to the side opposite of obstacle
                if dx > 0:
                    target_x = max(road_left + 30, car_x - 120)
                else:
                    target_x = min(road_right - 30, car_x + 120)

        # steering control: proportional to difference
        diff = target_x - car_x
        # map diff to steering degrees
        steer = (diff / (self.config.TRACK_WIDTH / 2)) * self.config.MAX_STEERING
        steer *= self.aggression
        steer = clamp(steer, -self.config.MAX_STEERING, self.config.MAX_STEERING)
        # smoothing
        steer = 0.85 * self.last_steer + 0.15 * steer
        self.last_steer = steer

        # throttle decision: accelerate if below max, slow if obstacle very close
        throttle = True
        for o in obstacles:
            dy = o['y'] - car_y
            dx = o['x'] - car_x
            if 0 < dy < 80 and abs(dx) < 70:
                throttle = False
                break

        return steer, throttle

    def decide_for_opponent(self, opp: dict, obstacles: List[dict]) -> None:

        # occasionally choose a target x (lane change)
        if opp.get('lane_change_target') is None or random.random() < 0.01:
            road_left = (self.config.WIDTH - self.config.TRACK_WIDTH) // 2 + 40
            road_right = road_left + self.config.TRACK_WIDTH - 80
            opp['lane_change_target'] = random.randint(road_left, road_right)
            opp['lane_change_timer'] = 0

        # move toward target
        tx = opp['lane_change_target']
        if tx is not None:
            dx = tx - opp['x']
            opp['x'] += clamp(dx, -2.5, 2.5)

        # simple obstacle avoidance for opponents
        for o in obstacles:
            dy = o['y'] - opp['y']
            dx = o['x'] - opp['x']
            if 0 < dy < 120 and abs(dx) < 90:
                # nudge sideways
                opp['x'] += -5 if dx > 0 else 5

        # random slight speed variation
        opp['speed'] = clamp(opp['speed'] + random.uniform(-0.1, 0.15), 2.5, 8.5)

# --------------------------
# Game Logic
# --------------------------
class GameLogic:
    """Pure game state + update logic."""

    def __init__(self, config: Config) -> None:
        self.config = config
        # Car (player)
        self.car_x = config.WIDTH // 2
        self.car_y = config.HEIGHT - 120
        self.car_speed = 0.0
        # Steering smoothing
        self.current_steering = 0.0
        self.steering_smoothing = 0.8

        # Track & objects
        self.track_lines = [i for i in range(0, config.HEIGHT + 100, config.LINE_GAP)]
        self.line_speed = 5
        self.obstacles: List[dict] = []
        self.opponent_cars: List[dict] = []
        self.power_ups: List[dict] = []

        # Timers & gameplay
        self.last_obstacle_spawn = time.time()
        self.obstacle_spawn_rate = 2.0
        self.score = 0
        self.high_score = 0
        self.level = 1
        self.boost_active = False
        self.boost_time = 0.0
        self.invincible = False
        self.invincible_time = 0.0
        self.particles: List[dict] = []
        self.screen_shake = 0

    # --- spawning and object updates ---
    def spawn_obstacle(self) -> None:
        now = time.time()
        if now - self.last_obstacle_spawn <= self.obstacle_spawn_rate:
            return
        road_left = (self.config.WIDTH - self.config.TRACK_WIDTH) // 2
        road_right = road_left + self.config.TRACK_WIDTH
        ox = random.randint(road_left + 30, road_right - 30)
        obstacle = {'x': ox, 'y': -50, 'width': 30, 'height': 40, 'type': random.choice(['barrier', 'oil', 'debris'])}
        self.obstacles.append(obstacle)
        self.last_obstacle_spawn = now
        self.obstacle_spawn_rate = max(1.0, 3.0 - (self.level * 0.2))

    def spawn_opponent(self) -> None:
        if len(self.opponent_cars) >= 3:
            return
        # slightly higher chance to spawn opponents than before so AI has company
        if random.random() > 0.04:
            return
        road_left = (self.config.WIDTH - self.config.TRACK_WIDTH) // 2
        road_right = road_left + self.config.TRACK_WIDTH
        ox = random.randint(road_left + 40, road_right - 40)
        opponent = {'x': ox, 'y': -80, 'speed': random.randint(3, 7), 'lane_change_timer': 0, 'lane_change_target': None}
        self.opponent_cars.append(opponent)

    def spawn_power_up(self) -> None:
        if len(self.power_ups) >= 1:
            return
        if random.random() > 0.005:
            return
        road_left = (self.config.WIDTH - self.config.TRACK_WIDTH) // 2
        road_right = road_left + self.config.TRACK_WIDTH
        px = random.randint(road_left + 20, road_right - 20)
        self.power_ups.append({'x': px, 'y': -30, 'type': random.choice(['boost', 'invincible', 'score']), 'pulse': 0.0})

    def update_track_lines(self) -> None:
        self.track_lines = [line + self.line_speed for line in self.track_lines]
        self.track_lines = [line for line in self.track_lines if line < self.config.HEIGHT + 50]
        while len(self.track_lines) == 0 or self.track_lines[0] > -self.config.LINE_GAP:
            if len(self.track_lines) == 0:
                new_line = -self.config.LINE_GAP
            else:
                new_line = self.track_lines[0] - self.config.LINE_GAP
            self.track_lines.insert(0, new_line)

    def update_obstacles(self) -> None:
        for o in self.obstacles[:]:
            o['y'] += self.line_speed + 2
            if o['y'] > self.config.HEIGHT:
                self.obstacles.remove(o)

    def update_opponents(self) -> None:
        for opp in self.opponent_cars[:]:
            opp['y'] += opp['speed']
            opp['lane_change_timer'] += 1
            if opp['lane_change_timer'] > 60 and random.random() < 0.1:
                opp['x'] += random.randint(-2, 2)
                opp['lane_change_timer'] = 0
            road_left = (self.config.WIDTH - self.config.TRACK_WIDTH) // 2 + 40
            road_right = road_left + self.config.TRACK_WIDTH - 80
            opp['x'] = clamp(opp['x'], road_left, road_right)
            if opp['y'] > self.config.HEIGHT:
                self.opponent_cars.remove(opp)
                self.score += 50

    def update_power_ups(self) -> None:
        for p in self.power_ups[:]:
            p['y'] += self.line_speed + 1
            p['pulse'] += 0.2
            if p['y'] > self.config.HEIGHT:
                self.power_ups.remove(p)

    # --- gameplay updates ---
    def update_car_physics(self, steering_input: float, hand_detected: bool) -> None:
        steering_factor = 0.2 * (1 + self.car_speed / 10)
        # smoothing
        self.current_steering = (self.steering_smoothing * self.current_steering +
                                 (1 - self.steering_smoothing) * steering_input)
        if not hand_detected:
            self.current_steering *= 0.9

        self.car_x += self.current_steering * steering_factor
        road_left = (self.config.WIDTH - self.config.TRACK_WIDTH) // 2 + 25
        road_right = road_left + self.config.TRACK_WIDTH - 50
        self.car_x = clamp(self.car_x, road_left, road_right)

        if hand_detected:
            self.car_speed = min(self.config.MAX_SPEED, self.car_speed + self.config.ACCELERATION)
        else:
            # slower deceleration if AI is controlling (we'll set hand_detected True when AI wants throttle)
            self.car_speed = max(0.0, self.car_speed - self.config.ACCELERATION * 2)

    def update_game_state(self) -> None:
        new_level = (self.score // 1000) + 1
        if new_level > self.level:
            self.level = new_level
            print(f"Level up! Now at level {self.level}")
        if self.score > self.high_score:
            self.high_score = self.score
        if self.boost_active and time.time() - self.boost_time > 3:
            self.boost_active = False
        base_speed = 5 + (self.level - 1) * 0.5
        self.line_speed = int(base_speed)
        self.score += int(self.car_speed)

    # --- interactions ---
    def activate_boost(self) -> None:
        self.boost_active = True
        self.boost_time = time.time()
        self.car_speed = min(self.config.MAX_SPEED + 5, self.car_speed + 3)

    def collect_power_up(self, ptype: str) -> None:
        if ptype == 'boost':
            self.activate_boost()
        elif ptype == 'invincible':
            self.invincible = True
            self.invincible_time = time.time()
        elif ptype == 'score':
            self.score += 200

    def check_collisions(self) -> Optional[str]:
        car_rect = {'left': self.car_x - 20, 'right': self.car_x + 20, 'top': self.car_y - 40, 'bottom': self.car_y + 40}
        if not self.invincible:
            for o in self.obstacles[:]:
                if (car_rect['left'] < o['x'] + o['width'] and car_rect['right'] > o['x'] and
                        car_rect['top'] < o['y'] + o['height'] and car_rect['bottom'] > o['y']):
                    self.obstacles.remove(o)
                    return o['type']
            for opp in self.opponent_cars[:]:
                if (car_rect['left'] < opp['x'] + 20 and car_rect['right'] > opp['x'] - 20 and
                        car_rect['top'] < opp['y'] + 40 and car_rect['bottom'] > opp['y'] - 40):
                    self.opponent_cars.remove(opp)
                    return 'opponent'
        for p in self.power_ups[:]:
            if (car_rect['left'] < p['x'] + 15 and car_rect['right'] > p['x'] - 15 and
                    car_rect['top'] < p['y'] + 15 and car_rect['bottom'] > p['y'] - 15):
                self.power_ups.remove(p)
                self.collect_power_up(p['type'])
        return None

    def restart(self) -> None:
        self.__init__(self.config)


# Rendering (OpenCV)

class Renderer:
    def __init__(self, config: Config, colors: dict = DEFAULT_COLORS) -> None:
        self.config = config
        self.colors = colors

    def render_frame(self, state: GameLogic, camera_frame: np.ndarray, hand_detected: bool, ai_active: bool) -> np.ndarray:
        frame = np.zeros((self.config.HEIGHT, self.config.WIDTH, 3), dtype=np.uint8)
        self._draw_background(frame, state)
        self._draw_track_lines(frame, state)
        self._draw_obstacles(frame, state)
        self._draw_opponents(frame, state)
        self._draw_powerups(frame, state)
        self._draw_car(frame, state)
        self._draw_particles(frame, state)
        self._draw_hud(frame, state, hand_detected, ai_active)
        self._draw_camera_preview(frame, camera_frame)
        return frame

    # drawing helpers (kept concise)
    def _draw_background(self, frame: np.ndarray, state: GameLogic) -> None:
        frame[:] = self.colors['grass']
        road_left = (self.config.WIDTH - self.config.TRACK_WIDTH) // 2
        road_right = road_left + self.config.TRACK_WIDTH
        cv2.rectangle(frame, (road_left, 0), (road_right, self.config.HEIGHT), self.colors['road'], -1)

    def _draw_track_lines(self, frame: np.ndarray, state: GameLogic) -> None:
        road_left = (self.config.WIDTH - self.config.TRACK_WIDTH) // 2
        road_right = road_left + self.config.TRACK_WIDTH
        for y in state.track_lines:
            if 0 <= y <= self.config.HEIGHT:
                cv2.rectangle(frame, (self.config.WIDTH//2 - 3, y), (self.config.WIDTH//2 + 3, y + 40), (0,255,255), -1)
                cv2.rectangle(frame, (road_left, y), (road_left + 15, y + 40), self.colors['lines'], -1)
                cv2.rectangle(frame, (road_right - 15, y), (road_right, y + 40), self.colors['lines'], -1)

    def _draw_obstacles(self, frame: np.ndarray, state: GameLogic) -> None:
        for o in state.obstacles:
            if o['type'] == 'barrier':
                cv2.rectangle(frame, (int(o['x'] - o['width']//2), int(o['y'])),
                              (int(o['x'] + o['width']//2), int(o['y'] + o['height'])), (0,165,255), -1)
            elif o['type'] == 'oil':
                cv2.circle(frame, (int(o['x']), int(o['y'] + o['height']//2)), o['width']//2, (20,20,20), -1)
            else:
                pts = np.array([[o['x'], o['y']], [o['x'] - o['width']//2, o['y'] + o['height']], [o['x'] + o['width']//2, o['y'] + o['height']]], np.int32)
                cv2.fillPoly(frame, [pts], (100,100,100))

    def _draw_opponents(self, frame: np.ndarray, state: GameLogic) -> None:
        for opp in state.opponent_cars:
            cv2.rectangle(frame, (int(opp['x'] - 18), int(opp['y'] - 35)), (int(opp['x'] + 18), int(opp['y'] + 35)), self.colors['opponent'], -1)

    def _draw_powerups(self, frame: np.ndarray, state: GameLogic) -> None:
        for p in state.power_ups:
            size = int(15 + 5 * math.sin(p['pulse']))
            color = self.colors['boost'] if p['type'] == 'boost' else (255,0,255) if p['type']=='invincible' else self.colors['power_up']
            cv2.circle(frame, (int(p['x']), int(p['y'])), size, color, -1)
            cv2.putText(frame, p['type'][0].upper(), (int(p['x'] - 8), int(p['y'] + 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255,255,255), 2)

    def _draw_car(self, frame: np.ndarray, state: GameLogic) -> None:
        car_w, car_h = 35, 70
        cx, cy = int(state.car_x), int(state.car_y)
        car_color = self.colors['car']
        cv2.rectangle(frame, (cx - car_w//2, cy - car_h//2), (cx + car_w//2, cy + car_h//2), car_color, -1)
        cv2.rectangle(frame, (cx - car_w//3, cy - car_h//3), (cx + car_w//3, cy + car_h//3), (0,0,0), -1)

    def _draw_particles(self, frame: np.ndarray, state: GameLogic) -> None:
        for p in state.particles:
            size = max(1, p.get('life', 30) // 5)
            cv2.circle(frame, (int(p['x']), int(p['y'])), size, p['color'], -1)

    def _draw_hud(self, frame: np.ndarray, state: GameLogic, hand_detected: bool, ai_active: bool) -> None:
        cv2.putText(frame, f"Score: {state.score}", (15,30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, self.colors['text'], 2)
        cv2.putText(frame, f"Level: {state.level}", (15,55), cv2.FONT_HERSHEY_SIMPLEX, 0.6, self.colors['text'], 2)
        speed_display = int(abs(state.car_speed * 15))
        cv2.putText(frame, f"Speed: {speed_display} km/h", (200,30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, self.colors['text'], 2)
        cv2.putText(frame, f"Steering: {int(state.current_steering)}\u00b0", (200,55), cv2.FONT_HERSHEY_SIMPLEX, 0.6, self.colors['text'], 2)
        status_text = "HANDS ON" if hand_detected else ("AI DRIVE" if ai_active else "HANDS OFF")
        status_col = (0,255,0) if hand_detected else ((255,200,0) if ai_active else (0,100,255))
        cv2.putText(frame, status_text, (400,30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, status_col, 2)

    def _draw_camera_preview(self, frame: np.ndarray, cam: np.ndarray) -> None:
        try:
            cam_small = cv2.resize(cam, (250,200))
            frame[self.config.HEIGHT-210:self.config.HEIGHT-10, self.config.WIDTH-260:self.config.WIDTH-10] = cam_small
            cv2.rectangle(frame, (self.config.WIDTH-260, self.config.HEIGHT-210), (self.config.WIDTH-10, self.config.HEIGHT-10), self.colors['text'], 3)
            cv2.putText(frame, "Hand Tracking", (self.config.WIDTH-250, self.config.HEIGHT-220), cv2.FONT_HERSHEY_SIMPLEX, 0.6, self.colors['text'], 2)
        except Exception:
            pass


# Controller 

class GameController:
    def __init__(self, config: Config) -> None:
        self.config = config
        self.logic = GameLogic(config)
        self.renderer = Renderer(config)
        self.tracker = HandTracker(config)
        self.ai = AIAgent(config)
        self.running = True
        self.game_over = False
        self.last_frame_time = time.time()

        # AI takeover settings
        self.no_hand_start: Optional[float] = None
        self.ai_takeover_delay = 1  # seconds without hands before AI engages
        self.ai_active = False

    def run(self) -> None:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Could not open camera")
            return

        print("Starting Advanced Virtual F1 Racing Game with AI")
        while self.running:
            ret, cam = cap.read()
            if not ret:
                break
            cam = cv2.flip(cam, 1)

            # Process hand input
            steering_input, hand_detected = self.tracker.process_frame(cam)

            # AI takeover logic: if hands absent for a while, AI steers
            now = time.time()
            if not hand_detected:
                if self.no_hand_start is None:
                    self.no_hand_start = now
                elif now - self.no_hand_start > self.ai_takeover_delay:
                    self.ai_active = True
            else:
                self.no_hand_start = None
                self.ai_active = False

            # if AI active, let agent decide steering & throttle
            if self.ai_active:
                steer_decision, throttle = self.ai.decide(
                    car_x=self.logic.car_x,
                    car_y=self.logic.car_y,
                    car_speed=self.logic.car_speed,
                    obstacles=self.logic.obstacles,
                    opponents=self.logic.opponent_cars
                )
                # use steer_decision as input; mark hand_detected=True to allow acceleration in physics
                steering_input = steer_decision
                hand_detected_for_physics = throttle
            else:
                hand_detected_for_physics = hand_detected

            if not self.game_over:
                # Spawning
                self.logic.spawn_obstacle()
                self.logic.spawn_opponent()
                self.logic.spawn_power_up()
                # Updates
                self.logic.update_track_lines()
                self.logic.update_obstacles()
                # Let AI tweak opponents before they move
                for opp in self.logic.opponent_cars:
                    self.ai.decide_for_opponent(opp, self.logic.obstacles)
                self.logic.update_opponents()
                self.logic.update_power_ups()
                self.logic.update_car_physics(steering_input, hand_detected_for_physics)
                self.logic.update_game_state()
                # Collisions
                collision = self.logic.check_collisions()
                if collision:
                    print(f"Collision: {collision}")
                    self.game_over = True
            else:
                # game over behaviour could be extended
                pass

            # Render
            out_frame = self.renderer.render_frame(self.logic, cam, hand_detected, self.ai_active)
            cv2.imshow('Advanced Virtual F1 (refactor + AI)', out_frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                self.running = False
            elif key == ord('r'):
                self.logic.restart()
                self.game_over = False
                self.ai_active = False
                self.no_hand_start = None
            elif key == ord('b'):
                self.logic.activate_boost()

            # basic FPS calc (not used further here)
            now = time.time()
            fps = 1.0 / (now - self.last_frame_time) if now != self.last_frame_time else 0.0
            self.last_frame_time = now

        cap.release()
        cv2.destroyAllWindows()


if __name__ == '__main__':
    cfg = Config()
    controller = GameController(cfg)
    controller.run()
