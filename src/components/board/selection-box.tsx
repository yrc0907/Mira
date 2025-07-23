"use client";

import React from "react";

export enum Side {
  Top = 1,
  Bottom = 2,
  Left = 4,
  Right = 8,
}

const HANDLE_WIDTH = 8;

// 新增移动手柄常量
const MOVE_HANDLE_SIZE = 14;

interface SelectionBoxProps {
  boundingBox: { x: number; y: number; width: number; height: number };
  onResizeHandlePointerDown: (
    e: React.PointerEvent,
    corner: Side,
    initialBounds: { x: number; y: number; width: number; height: number },
  ) => void;
  onMoveHandlePointerDown?: (
    e: React.PointerEvent,
    initialBounds: { x: number; y: number; width: number; height: number },
  ) => void;
}

// 创建移动手柄组件
export const MoveHandle = React.memo(
  ({ x, y, size, onPointerDown }: {
    x: number;
    y: number;
    size: number;
    onPointerDown: (e: React.PointerEvent) => void;
  }) => {
    return (
      <g
        onPointerDown={onPointerDown}
        style={{ cursor: "move" }}
        className="move-handle"
      >
        <circle
          cx={x}
          cy={y}
          r={size / 2}
          fill="#ffffff"
          stroke="#007bff"
          strokeWidth={1.5}
        />
        {/* 添加移动图标 */}
        <path
          d={`M${x - size / 3},${y} L${x + size / 3},${y} M${x},${y - size / 3} L${x},${y + size / 3}`}
          stroke="#007bff"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <path
          d={`M${x - size / 4},${y - size / 4} L${x - size / 4 - 2},${y - size / 4 - 2} M${x + size / 4},${y - size / 4} L${x + size / 4 + 2},${y - size / 4 - 2} M${x - size / 4},${y + size / 4} L${x - size / 4 - 2},${y + size / 4 + 2} M${x + size / 4},${y + size / 4} L${x + size / 4 + 2},${y + size / 4 + 2}`}
          stroke="#007bff"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </g>
    );
  }
);

MoveHandle.displayName = "MoveHandle";

export const SelectionBox = React.memo(
  ({ boundingBox, onResizeHandlePointerDown, onMoveHandlePointerDown }: SelectionBoxProps) => {
    const handlePointerDown = (
      e: React.PointerEvent,
      corner: Side,
    ) => {
      e.stopPropagation();
      onResizeHandlePointerDown(e, corner, boundingBox);
    };

    const handleMovePointerDown = (e: React.PointerEvent) => {
      e.stopPropagation();
      if (onMoveHandlePointerDown) {
        onMoveHandlePointerDown(e, boundingBox);
      }
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
        {/* 添加中心移动手柄 */}
        <MoveHandle
          x={boundingBox.x + boundingBox.width / 2}
          y={boundingBox.y + boundingBox.height / 2}
          size={MOVE_HANDLE_SIZE}
          onPointerDown={handleMovePointerDown}
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

// 为多选框也添加移动手柄
export interface MultiSelectionBoxProps {
  boundingBox: { x: number; y: number; width: number; height: number };
  onResizeHandlePointerDown: (
    e: React.PointerEvent,
    corner: Side,
    initialBounds: { x: number; y: number; width: number; height: number },
  ) => void;
  onMoveHandlePointerDown?: (
    e: React.PointerEvent,
    initialBounds: { x: number; y: number; width: number; height: number },
  ) => void;
}

export const MultiSelectionBox = React.memo(
  ({ boundingBox, onResizeHandlePointerDown, onMoveHandlePointerDown }: MultiSelectionBoxProps) => {
    const handlePointerDown = (
      e: React.PointerEvent,
      corner: Side,
    ) => {
      e.stopPropagation();
      onResizeHandlePointerDown(e, corner, boundingBox);
    };

    const handleMovePointerDown = (e: React.PointerEvent) => {
      e.stopPropagation();
      if (onMoveHandlePointerDown) {
        onMoveHandlePointerDown(e, boundingBox);
      }
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
          strokeDasharray="5,5"
          className="pointer-events-none"
        />
        {/* 添加中心移动手柄 */}
        <MoveHandle
          x={boundingBox.x + boundingBox.width / 2}
          y={boundingBox.y + boundingBox.height / 2}
          size={MOVE_HANDLE_SIZE}
          onPointerDown={handleMovePointerDown}
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

MultiSelectionBox.displayName = "MultiSelectionBox";

// For drag selection
export interface DragSelectionBoxProps {
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
}

export const DragSelectionBox = React.memo(
  ({ startPoint, endPoint }: DragSelectionBoxProps) => {
    const x = Math.min(startPoint.x, endPoint.x);
    const y = Math.min(startPoint.y, endPoint.y);
    const width = Math.abs(endPoint.x - startPoint.x);
    const height = Math.abs(endPoint.y - startPoint.y);

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(0, 123, 255, 0.1)"
        stroke="#007bff"
        strokeWidth={1}
        strokeDasharray="5,5"
        className="pointer-events-none"
      />
    );
  }
);

DragSelectionBox.displayName = "DragSelectionBox"; 