/**
 * Transform coordinates from top-bottom to left-right orientation
 * GK will appear on the left, strikers on the right
 * This is a 90° counter-clockwise rotation
 */
export function toLeftRight(x: number, y: number): { x: number; y: number } {
  return { x: 100 - y, y: x };
}