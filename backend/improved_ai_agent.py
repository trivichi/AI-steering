# improved_ai_agent.py
import math
from typing import List, Tuple, Dict, Optional
from dataclasses import dataclass

@dataclass
class Vector2D:
    x: float
    y: float
    
    def distance_to(self, other: 'Vector2D') -> float:
        return math.hypot(self.x - other.x, self.y - other.y)
    
    def angle_to(self, other: 'Vector2D') -> float:
        return math.atan2(other.y - self.y, other.x - self.x)

class ImprovedAIAgent:
    """
    Enhanced AI agent with:
    - Predictive collision avoidance
    - Path planning with lookahead
    - Adaptive behavior based on speed
    - Multiple threat assessment
    """
    
    def __init__(self, config) -> None:
        self.config = config
        self.aggression = 0.85  # Slightly reduced for safety
        
        # Vision parameters
        self.vision_distance = 300  # How far ahead to look
        self.side_vision_angle = 45  # Degrees to check on sides
        self.critical_distance = 100  # Emergency brake distance
        self.safe_distance = 180  # Start avoiding at this distance
        
        # Smoothing
        self.last_steer = 0.0
        self.steer_smoothing = 0.75
        
        # Path planning
        self.target_lane = None
        self.lane_change_cooldown = 0
        
    def decide(self, car_x: float, car_y: float, car_speed: float, 
               obstacles: List[dict], opponents: List[dict]) -> Tuple[float, bool]:
        """
        Advanced decision making with threat assessment and path planning.
        """
        # Calculate road boundaries
        road_left = (self.config.WIDTH - self.config.TRACK_WIDTH) // 2 + 25
        road_right = road_left + self.config.TRACK_WIDTH - 50
        road_center = (road_left + road_right) / 2
        
        # Create position vector
        car_pos = Vector2D(car_x, car_y)
        
        # Assess all threats
        threats = self._assess_threats(car_pos, car_speed, obstacles, opponents)
        
        # Determine best lane/position
        target_x = self._plan_path(car_pos, car_speed, threats, road_left, road_right, road_center)
        
        # Calculate steering
        steer = self._calculate_steering(car_x, target_x, car_speed)
        
        # Decide throttle
        throttle = self._decide_throttle(car_speed, threats)
        
        return steer, throttle
    
    def _assess_threats(self, car_pos: Vector2D, car_speed: float,
                       obstacles: List[dict], opponents: List[dict]) -> List[Dict]:
        """
        Assess all threats ahead with danger scoring.
        """
        threats = []
        
        # Check obstacles
        for obs in obstacles:
            obs_pos = Vector2D(obs['x'], obs['y'])
            
            # Only consider things ahead
            if obs_pos.y <= car_pos.y:
                continue
            
            distance = car_pos.distance_to(obs_pos)
            dx = abs(obs_pos.x - car_pos.x)
            dy = obs_pos.y - car_pos.y
            
            # Calculate if it's in our path
            lateral_offset = dx
            
            # Only consider if it's in our vision range
            if dy < self.vision_distance:
                # Danger score based on distance and lateral offset
                danger = 1.0
                if dy > 0:
                    danger = 1.0 - (dy / self.vision_distance)
                
                # Increase danger if it's directly in front
                if lateral_offset < 50:
                    danger *= 1.5
                elif lateral_offset < 100:
                    danger *= 1.2
                
                # Critical threat if very close
                if dy < self.critical_distance and lateral_offset < 60:
                    danger = 2.0
                
                threats.append({
                    'pos': obs_pos,
                    'type': 'obstacle',
                    'distance': dy,
                    'lateral_offset': lateral_offset,
                    'danger': danger,
                    'width': obs.get('width', 30)
                })
        
        # Check opponents
        for opp in opponents:
            opp_pos = Vector2D(opp['x'], opp['y'])
            
            if opp_pos.y <= car_pos.y:
                continue
            
            distance = car_pos.distance_to(opp_pos)
            dx = abs(opp_pos.x - car_pos.x)
            dy = opp_pos.y - car_pos.y
            
            if dy < self.vision_distance:
                danger = 0.8 * (1.0 - (dy / self.vision_distance))
                
                if dx < 50:
                    danger *= 1.3
                
                threats.append({
                    'pos': opp_pos,
                    'type': 'opponent',
                    'distance': dy,
                    'lateral_offset': dx,
                    'danger': danger,
                    'width': 40
                })
        
        # Sort by danger level
        threats.sort(key=lambda t: t['danger'], reverse=True)
        return threats
    
    def _plan_path(self, car_pos: Vector2D, car_speed: float, threats: List[Dict],
                   road_left: float, road_right: float, road_center: float) -> float:
        """
        Plan the best path considering all threats.
        """
        # Define three lanes
        lane_width = (road_right - road_left) / 3
        left_lane = road_left + lane_width * 0.5
        center_lane = road_center
        right_lane = road_right - lane_width * 0.5
        
        lanes = [left_lane, center_lane, right_lane]
        
        # Score each lane based on threats
        lane_scores = [1.0, 1.0, 1.0]  # Start with equal scores
        
        for threat in threats:
            threat_x = threat['pos'].x
            threat_distance = threat['distance']
            threat_width = threat['width']
            
            # Reduce score for lanes that have threats
            for i, lane_x in enumerate(lanes):
                lateral_distance = abs(threat_x - lane_x)
                
                # If threat is in this lane
                if lateral_distance < (threat_width + 40):  # Lane width consideration
                    # Closer threats have more impact
                    impact = 1.0 - (threat_distance / self.vision_distance)
                    impact *= threat['danger']
                    lane_scores[i] -= impact
        
        # Prefer center lane slightly (more options)
        lane_scores[1] += 0.1
        
        # Find best lane
        best_lane_idx = lane_scores.index(max(lane_scores))
        target_x = lanes[best_lane_idx]
        
        # Handle lane change cooldown
        if self.lane_change_cooldown > 0:
            self.lane_change_cooldown -= 1
            if self.target_lane is not None:
                target_x = self.target_lane
        else:
            self.target_lane = target_x
            self.lane_change_cooldown = 20  # Cooldown frames
        
        # Emergency avoidance for critical threats
        if threats and threats[0]['danger'] > 1.5:
            critical = threats[0]
            # Dodge hard away from threat
            if critical['pos'].x > car_pos.x:
                # Threat is on right, go left
                target_x = min(target_x - 80, road_left + 40)
            else:
                # Threat is on left, go right
                target_x = max(target_x + 80, road_right - 40)
        
        # Ensure target is within bounds
        target_x = max(road_left + 30, min(road_right - 30, target_x))
        
        return target_x
    
    def _calculate_steering(self, car_x: float, target_x: float, car_speed: float) -> float:
        """
        Calculate smooth steering to reach target position.
        """
        diff = target_x - car_x
        
        # Proportional steering with speed-based adjustment
        base_steer = (diff / (self.config.TRACK_WIDTH / 2)) * self.config.MAX_STEERING
        
        # Reduce steering at high speeds for stability
        speed_factor = 1.0 - (car_speed / self.config.MAX_SPEED) * 0.3
        base_steer *= speed_factor * self.aggression
        
        # Clamp
        base_steer = max(-self.config.MAX_STEERING, min(self.config.MAX_STEERING, base_steer))
        
        # Smooth steering changes
        steer = self.steer_smoothing * self.last_steer + (1 - self.steer_smoothing) * base_steer
        self.last_steer = steer
        
        return steer
    
    def _decide_throttle(self, car_speed: float, threats: List[Dict]) -> bool:
        """
        Decide whether to accelerate based on threats ahead.
        """
        # Default: accelerate if below max speed
        if car_speed < self.config.MAX_SPEED:
            throttle = True
        else:
            throttle = False
        
        # Check for critical threats requiring braking
        for threat in threats:
            if threat['danger'] > 1.5:
                # Critical threat - brake!
                throttle = False
                break
            elif threat['danger'] > 1.0 and threat['distance'] < self.critical_distance:
                # Close threat - stop accelerating
                throttle = False
                break
            elif threat['danger'] > 0.8 and threat['distance'] < self.safe_distance:
                # Moderate threat ahead - slow down
                if car_speed > self.config.MAX_SPEED * 0.7:
                    throttle = False
        
        return throttle
    
    def decide_for_opponent(self, opp: dict, obstacles: List[dict]) -> None:
        """
        Enhanced opponent behavior.
        """
        road_left = (self.config.WIDTH - self.config.TRACK_WIDTH) // 2 + 40
        road_right = road_left + self.config.TRACK_WIDTH - 80
        
        # Simple lane changes with obstacle avoidance
        if opp.get('lane_change_target') is None or opp.get('lane_change_timer', 0) <= 0:
            opp['lane_change_target'] = road_left + (road_right - road_left) * (0.3 + 0.4 * hash(str(opp['x'])) % 100 / 100)
            opp['lane_change_timer'] = 60
        
        opp['lane_change_timer'] -= 1
        
        # Move toward target
        tx = opp['lane_change_target']
        dx = tx - opp['x']
        move_speed = max(-3.0, min(3.0, dx * 0.15))
        opp['x'] += move_speed
        
        # Obstacle avoidance
        for o in obstacles:
            dy = o['y'] - opp['y']
            dx_obs = o['x'] - opp['x']
            if 0 < dy < 150 and abs(dx_obs) < 70:
                # Dodge obstacle
                dodge = -8 if dx_obs > 0 else 8
                opp['x'] += dodge
        
        # Keep in bounds
        opp['x'] = max(road_left, min(road_right, opp['x']))
        
        # Vary speed
        import random
        opp['speed'] = max(3.0, min(8.0, opp['speed'] + random.uniform(-0.15, 0.2)))