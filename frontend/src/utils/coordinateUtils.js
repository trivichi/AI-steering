/**
 * Convert from OpenCV coordinate system (top-left origin, y-down)
 * to Three.js coordinate system (center origin, y-up)
 */

export function toThreeX(x, width = 1200) {
  return x - width / 2;
}

export function toThreeY(y, height = 800) {
  return -(y - height / 2);
}

export function getObstacleColor(type) {
  switch (type) {
    case 'barrier':
      return '#ffa500'; // Orange
    case 'oil':
      return '#1a1a1a'; // Dark gray
    case 'debris':
      return '#646464'; // Medium gray
    default:
      return '#ff0000'; // Red fallback
  }
}

export function getPowerUpColor(type) {
  switch (type) {
    case 'boost':
      return '#ffd700'; // Gold
    case 'invincible':
      return '#ff00ff'; // Magenta
    case 'score':
      return '#ffa500'; // Orange
    default:
      return '#00ff00'; // Green fallback
  }
}