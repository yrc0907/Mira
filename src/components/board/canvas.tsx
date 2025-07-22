"use client";

import React, { useState, useCallback, WheelEvent, useMemo } from "react";
import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import { SelectionBox, Side } from "./selection-box";

export enum Tool {
  None,
  Selection,
  Rectangle,
  Circle,
  Pencil,
  Text,
  StickyNote,
}

export enum CanvasMode {
  None,
  Pressing,
  Translating,
  Drawing,
  Resizing,
}

type Point = { x: number; y: number };

export type Layer = {
  id: string;
  type: Tool.Rectangle;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: string;
};

type CanvasState =
  | { mode: CanvasMode.None }
  | { mode: CanvasMode.Pressing; origin: Point }
  | { mode: CanvasMode.Translating; origin: Point }
  | {
    mode: CanvasMode.Drawing;
    layerType: Tool.Rectangle;
    origin: Point;
  }
  | {
    mode: CanvasMode.Resizing;
    initialBounds: { x: number; y: number; width: number; height: number };
    corner: Side;
    origin: Point;
  };

interface CanvasProps {
  boardId: string;
}

const LayerComponent = ({
  layer,
  onLayerPointerDown,
  selected,
}: {
  layer: Layer;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  selected: boolean;
}) => {
  return (
    <rect
      onPointerDown={(e) => onLayerPointerDown(e, layer.id)}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      fill={layer.fill}
      strokeWidth={1}
      stroke={selected ? "#007bff" : "transparent"}
      className="pointer-events-auto"
    />
  );
};

export function Canvas({ boardId }: CanvasProps) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>(Tool.None);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });

  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const [history, setHistory] = useState<Layer[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const updateHistory = (newLayers: Layer[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    setHistory([...newHistory, newLayers]);
    setHistoryIndex(newHistory.length);
  };

  const undo = () => {
    if (canUndo) {
      const newIndex = historyIndex - 1;
      setLayers(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (canRedo) {
      const newIndex = historyIndex + 1;
      setLayers(history[newIndex]);
      setHistoryIndex(newIndex);
    }
  };

  const screenToWorld = (clientX: number, clientY: number) => {
    return {
      x: clientX - camera.x,
      y: clientY - camera.y,
    };
  };

  const resizeBounds = (
    bounds: { x: number; y: number; width: number; height: number },
    corner: Side,
    dx: number,
    dy: number,
  ): { x: number; y: number; width: number; height: number } => {
    const newBounds = { ...bounds };

    if ((corner & Side.Left) === Side.Left) {
      newBounds.x = bounds.x + dx;
      newBounds.width = bounds.width - dx;
    }

    if ((corner & Side.Right) === Side.Right) {
      newBounds.width = bounds.width + dx;
    }

    if ((corner & Side.Top) === Side.Top) {
      newBounds.y = bounds.y + dy;
      newBounds.height = bounds.height - dy;
    }

    if ((corner & Side.Bottom) === Side.Bottom) {
      newBounds.height = bounds.height + dy;
    }

    return newBounds;
  };

  const onLayerPointerDown = useCallback(
    (e: React.PointerEvent, layerId: string) => {
      if (activeTool === Tool.Selection) {
        e.stopPropagation();
        const point = screenToWorld(e.clientX, e.clientY);
        setCanvasState({ mode: CanvasMode.Pressing, origin: point });
        setSelectedLayerId(layerId);
      }
    },
    [activeTool, camera],
  );

  const onResizeHandlePointerDown = useCallback(
    (e: React.PointerEvent, corner: Side, initialBounds: { x: number; y: number; width: number; height: number }) => {
      const origin = screenToWorld(e.clientX, e.clientY);
      setCanvasState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
        origin,
      });
    },
    [camera],
  );

  const onWheel = useCallback((e: WheelEvent) => {
    if (canvasState.mode === CanvasMode.None) {
      setCamera((camera) => ({
        x: camera.x - e.deltaX,
        y: camera.y - e.deltaY,
      }));
    }
  }, [canvasState.mode]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const point = screenToWorld(e.clientX, e.clientY);
      if (canvasState.mode === CanvasMode.Pressing) {
        setCanvasState({ mode: CanvasMode.Translating, origin: point });
      } else if (canvasState.mode === CanvasMode.Translating) {
        const dx = point.x - canvasState.origin.x;
        const dy = point.y - canvasState.origin.y;

        setLayers((layers) =>
          layers.map((layer) => {
            if (layer.id === selectedLayerId) {
              return { ...layer, x: layer.x + dx, y: layer.y + dy };
            }
            return layer;
          }),
        );
        setCanvasState({ mode: CanvasMode.Translating, origin: point });
      } else if (canvasState.mode === CanvasMode.Resizing) {
        const currentPoint = screenToWorld(e.clientX, e.clientY);
        const dx = currentPoint.x - canvasState.origin.x;
        const dy = currentPoint.y - canvasState.origin.y;

        const newBounds = resizeBounds(
          canvasState.initialBounds,
          canvasState.corner,
          dx,
          dy,
        );
        setLayers((layers) =>
          layers.map((layer) => {
            if (layer.id === selectedLayerId) {
              return { ...layer, ...newBounds };
            }
            return layer;
          }),
        );
      }
    },
    [canvasState, selectedLayerId, camera],
  );

  const onPointerUp = useCallback(() => {
    if (
      canvasState.mode === CanvasMode.Translating ||
      canvasState.mode === CanvasMode.Resizing
    ) {
      updateHistory(layers);
    }
    setCanvasState({ mode: CanvasMode.None });
  }, [canvasState, layers]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (activeTool === Tool.Selection) {
        setSelectedLayerId(null);
        return;
      }

      if (activeTool === Tool.Rectangle) {
        const point = screenToWorld(e.clientX, e.clientY);
        const newLayer: Layer = {
          id: new Date().toISOString(),
          type: Tool.Rectangle,
          x: point.x,
          y: point.y,
          width: 100,
          height: 100,
          fill: "black",
        };

        const updatedLayers = [...layers, newLayer];
        setLayers(updatedLayers);
        updateHistory(updatedLayers);
        setActiveTool(Tool.Selection);
        setSelectedLayerId(newLayer.id);
      }
    },
    [activeTool, layers, camera],
  );

  const selectedLayer = useMemo(() => {
    return selectedLayerId ? layers.find((l) => l.id === selectedLayerId) : null;
  }, [layers, selectedLayerId]);

  return (
    <div
      className="h-full w-full relative bg-neutral-100 touch-none"
      onWheel={onWheel}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerDown={onPointerDown}
    >
      <Info boardTitle="Team meeting" />
      <Participants />
      <Toolbar
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <svg className="h-full w-full">
        <g transform={`translate(${camera.x}, ${camera.y})`}>
          {layers.map((layer) => (
            <LayerComponent
              key={layer.id}
              layer={layer}
              onLayerPointerDown={onLayerPointerDown}
              selected={layer.id === selectedLayerId}
            />
          ))}
          {selectedLayer && (
            <SelectionBox
              boundingBox={selectedLayer}
              onResizeHandlePointerDown={onResizeHandlePointerDown}
            />
          )}
        </g>
      </svg>
    </div>
  );
} 