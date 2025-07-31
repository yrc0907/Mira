import { useEffect, useMemo } from "react";
import { Point } from "@/types/canvas";

interface SelectionNetProps {
  origin: Point;
  current?: Point;
}

export const SelectionNet = ({
  origin,
  current
}: SelectionNetProps) => {
  // 如果还没有current点，不显示选择框
  if (!current) return null;

  // 计算选择框的位置和大小
  const x = Math.min(origin.x, current.x);
  const y = Math.min(origin.y, current.y);
  const width = Math.abs(current.x - origin.x);
  const height = Math.abs(current.y - origin.y);

  if (width === 0 || height === 0) return null;

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="rgb(59, 130, 246)"
      strokeWidth={1}
    />
  );
}; 