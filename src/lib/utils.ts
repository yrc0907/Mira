import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Point } from "@/types/canvas";

/**
 * Combines multiple class names or conditional class names and merges them using Tailwind's class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = [
  "#DC2626",
  "#D97706",
  "#059669",
  "#7C3AED",
  "#DB2777"
];

export function connectionIdToColor(connectionId: number): string {
  return COLORS[connectionId % COLORS.length];
};

/**
 * Converts a pointer event to canvas coordinates
 */
export const pointerEventToCanvasPoint = (
  e: React.PointerEvent,
  camera: { x: number; y: number } = { x: 0, y: 0 },
): Point => {
  return {
    x: e.clientX - camera.x,
    y: e.clientY - camera.y,
  };
};

/**
 * Resize bounds based on corner and delta
 */
export const resizeBounds = (
  bounds: { x: number; y: number; width: number; height: number },
  corner: number,
  dx: number,
  dy: number,
): { x: number; y: number; width: number; height: number } => {
  const { x, y, width, height } = bounds;

  // Based on which corner is being dragged, update the bounds
  switch (corner) {
    case 1: // Top
      return {
        x,
        y: y + dy,
        width,
        height: height - dy,
      };
    case 2: // Bottom
      return {
        x,
        y,
        width,
        height: height + dy,
      };
    case 4: // Left
      return {
        x: x + dx,
        y,
        width: width - dx,
        height,
      };
    case 8: // Right
      return {
        x,
        y,
        width: width + dx,
        height,
      };
    default:
      return bounds;
  }
};
