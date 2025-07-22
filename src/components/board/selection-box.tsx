"use client";

import React from "react";

export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

const HANDLE_WIDTH = 8;

interface SelectionBoxProps {
  boundingBox: { x: number; y: number; width: number; height: number };
  onResizeHandlePointerDown: (
    e: React.PointerEvent,
    corner: Side,
    initialBounds: { x: number; y: number; width: number; height: number },
  ) => void;
}

export const SelectionBox = React.memo(
  ({ boundingBox, onResizeHandlePointerDown }: SelectionBoxProps) => {
    const handlePointerDown = (
      e: React.PointerEvent,
      corner: Side,
    ) => {
      e.stopPropagation();
      onResizeHandlePointerDown(e, corner, boundingBox);
    };

    return (
      <>
        <rect
          x={boundingBox.x}
          y={boundingBox.y}
          width={boundingBox.width}
          height={boundingBox.height}
          fill="transparent"
          stroke="#007bff"
          strokeWidth={1}
          className="pointer-events-none"
        />
        {/* Top */}
        <rect
          x={boundingBox.x + boundingBox.width / 2 - HANDLE_WIDTH / 2}
          y={boundingBox.y - HANDLE_WIDTH / 2}
          width={HANDLE_WIDTH}
          height={HANDLE_WIDTH}
          onPointerDown={(e) => handlePointerDown(e, Side.Top)}
          style={{ cursor: "ns-resize" }}
          fill="#007bff"
        />
        {/* Bottom */}
        <rect
          x={boundingBox.x + boundingBox.width / 2 - HANDLE_WIDTH / 2}
          y={boundingBox.y + boundingBox.height - HANDLE_WIDTH / 2}
          width={HANDLE_WIDTH}
          height={HANDLE_WIDTH}
          onPointerDown={(e) => handlePointerDown(e, Side.Bottom)}
          style={{ cursor: "ns-resize" }}
          fill="#007bff"
        />
        {/* Left */}
        <rect
          x={boundingBox.x - HANDLE_WIDTH / 2}
          y={boundingBox.y + boundingBox.height / 2 - HANDLE_WIDTH / 2}
          width={HANDLE_WIDTH}
          height={HANDLE_WIDTH}
          onPointerDown={(e) => handlePointerDown(e, Side.Left)}
          style={{ cursor: "ew-resize" }}
          fill="#007bff"
        />
        {/* Right */}
        <rect
          x={boundingBox.x + boundingBox.width - HANDLE_WIDTH / 2}
          y={boundingBox.y + boundingBox.height / 2 - HANDLE_WIDTH / 2}
          width={HANDLE_WIDTH}
          height={HANDLE_WIDTH}
          onPointerDown={(e) => handlePointerDown(e, Side.Right)}
          style={{ cursor: "ew-resize" }}
          fill="#007bff"
        />
        {/* Top-left */}
        <rect
          x={boundingBox.x - HANDLE_WIDTH / 2}
          y={boundingBox.y - HANDLE_WIDTH / 2}
          width={HANDLE_WIDTH}
          height={HANDLE_WIDTH}
          onPointerDown={(e) => handlePointerDown(e, Side.Top | Side.Left)}
          style={{ cursor: "nwse-resize" }}
          fill="#007bff"
        />
        {/* Top-right */}
        <rect
          x={boundingBox.x + boundingBox.width - HANDLE_WIDTH / 2}
          y={boundingBox.y - HANDLE_WIDTH / 2}
          width={HANDLE_WIDTH}
          height={HANDLE_WIDTH}
          onPointerDown={(e) => handlePointerDown(e, Side.Top | Side.Right)}
          style={{ cursor: "nesw-resize" }}
          fill="#007bff"
        />
        {/* Bottom-left */}
        <rect
          x={boundingBox.x - HANDLE_WIDTH / 2}
          y={boundingBox.y + boundingBox.height - HANDLE_WIDTH / 2}
          width={HANDLE_WIDTH}
          height={HANDLE_WIDTH}
          onPointerDown={(e) => handlePointerDown(e, Side.Bottom | Side.Left)}
          style={{ cursor: "nesw-resize" }}
          fill="#007bff"
        />
        {/* Bottom-right */}
        <rect
          x={boundingBox.x + boundingBox.width - HANDLE_WIDTH / 2}
          y={boundingBox.y + boundingBox.height - HANDLE_WIDTH / 2}
          width={HANDLE_WIDTH}
          height={HANDLE_WIDTH}
          onPointerDown={(e) => handlePointerDown(e, Side.Bottom | Side.Right)}
          style={{ cursor: "nwse-resize" }}
          fill="#007bff"
        />
      </>
    );
  },
);

SelectionBox.displayName = "SelectionBox"; 