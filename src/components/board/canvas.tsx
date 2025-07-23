"use client";

import React, { useState, useCallback, WheelEvent, useMemo, useRef } from "react";
import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import { SelectionBox, Side, DragSelectionBox, MultiSelectionBox } from "./selection-box";
import { ContextMenu } from "./context-menu";

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
  DragSelecting,
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
  }
  | {
    mode: CanvasMode.DragSelecting;
    origin: Point;
    current: Point;
  };

interface CanvasProps {
  boardId: string;
}

const LayerComponent = ({
  layer,
  onLayerPointerDown,
  onLayerContextMenu,
  selected,
}: {
  layer: Layer;
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void;
  onLayerContextMenu: (e: React.MouseEvent, layerId: string) => void;
  selected: boolean;
}) => {
  return (
    <rect
      onPointerDown={(e) => onLayerPointerDown(e, layer.id)}
      onContextMenu={(e) => onLayerContextMenu(e, layer.id)}
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
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    layerId: string;
  } | null>(null);

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

        // Handle multi-selection with shift key
        if (e.shiftKey) {
          setSelectedLayerIds((prev) => {
            if (prev.includes(layerId)) {
              return prev.filter(id => id !== layerId);
            } else {
              return [...prev, layerId];
            }
          });
        } else {
          if (!selectedLayerIds.includes(layerId)) {
            setSelectedLayerIds([layerId]);
          }
        }
      }
    },
    [activeTool, camera, selectedLayerIds],
  );

  const onLayerContextMenu = useCallback(
    (e: React.MouseEvent, layerId: string) => {
      e.preventDefault();
      const point = screenToWorld(e.clientX, e.clientY);
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        layerId: layerId,
      });
      if (!selectedLayerIds.includes(layerId)) {
        setSelectedLayerIds([layerId]);
      }
    },
    [camera, selectedLayerIds],
  );

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleColorChange = useCallback(
    (color: string) => {
      if (contextMenu) {
        setLayers((layers) => {
          const updatedLayers = layers.map((layer) => {
            if (selectedLayerIds.includes(layer.id)) {
              return { ...layer, fill: color };
            }
            return layer;
          });
          updateHistory(updatedLayers);
          return updatedLayers;
        });
      }
    },
    [contextMenu, selectedLayerIds],
  );

  const [initialLayerStates, setInitialLayerStates] = useState<Record<string, Layer>>({});

  const onResizeHandlePointerDown = useCallback(
    (e: React.PointerEvent, corner: Side, initialBounds: { x: number; y: number; width: number; height: number }) => {
      const origin = screenToWorld(e.clientX, e.clientY);

      // Store initial state of all selected layers for proportional resizing
      const layerStates: Record<string, Layer> = {};
      selectedLayerIds.forEach(id => {
        const layer = layers.find(l => l.id === id);
        if (layer) {
          layerStates[id] = { ...layer };
        }
      });
      setInitialLayerStates(layerStates);

      setCanvasState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
        origin,
      });
    },
    [camera, selectedLayerIds, layers],
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
            if (selectedLayerIds.includes(layer.id)) {
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

        const newSelectionBounds = resizeBounds(
          canvasState.initialBounds,
          canvasState.corner,
          dx,
          dy,
        );

        // Calculate scale factors - prevent division by zero
        const scaleX = canvasState.initialBounds.width === 0
          ? 1
          : newSelectionBounds.width / canvasState.initialBounds.width;
        const scaleY = canvasState.initialBounds.height === 0
          ? 1
          : newSelectionBounds.height / canvasState.initialBounds.height;

        // Calculate anchor points based on resize corner
        let anchorX = canvasState.initialBounds.x;
        let anchorY = canvasState.initialBounds.y;

        if ((canvasState.corner & Side.Right) === Side.Right) {
          // Anchor to the left edge
          anchorX = canvasState.initialBounds.x;
        } else if ((canvasState.corner & Side.Left) === Side.Left) {
          // Anchor to the right edge
          anchorX = canvasState.initialBounds.x + canvasState.initialBounds.width;
        } else {
          // Anchor to center for top/bottom resize
          anchorX = canvasState.initialBounds.x + canvasState.initialBounds.width / 2;
        }

        if ((canvasState.corner & Side.Bottom) === Side.Bottom) {
          // Anchor to the top edge
          anchorY = canvasState.initialBounds.y;
        } else if ((canvasState.corner & Side.Top) === Side.Top) {
          // Anchor to the bottom edge
          anchorY = canvasState.initialBounds.y + canvasState.initialBounds.height;
        } else {
          // Anchor to center for left/right resize
          anchorY = canvasState.initialBounds.y + canvasState.initialBounds.height / 2;
        }

        // Apply resize to all selected layers proportionally
        setLayers((layers) =>
          layers.map((layer) => {
            if (selectedLayerIds.includes(layer.id) && initialLayerStates[layer.id]) {
              const initialLayer = initialLayerStates[layer.id];

              // Calculate position relative to anchor point
              const relativeX = initialLayer.x - canvasState.initialBounds.x;
              const relativeY = initialLayer.y - canvasState.initialBounds.y;

              // Determine new position based on resize direction and scaling
              let newX, newY;

              if ((canvasState.corner & Side.Right) === Side.Right) {
                // Scaling from left side as anchor
                newX = canvasState.initialBounds.x + relativeX * scaleX;
              } else if ((canvasState.corner & Side.Left) === Side.Left) {
                // Scaling from right side as anchor
                const rightEdge = canvasState.initialBounds.x + canvasState.initialBounds.width;
                const distanceFromRight = rightEdge - (initialLayer.x + initialLayer.width);
                newX = newSelectionBounds.x + newSelectionBounds.width - distanceFromRight * scaleX - initialLayer.width * scaleX;
              } else {
                // Maintain horizontal center alignment
                const centerOffsetX = initialLayer.x + initialLayer.width / 2 - (canvasState.initialBounds.x + canvasState.initialBounds.width / 2);
                newX = newSelectionBounds.x + newSelectionBounds.width / 2 + centerOffsetX * scaleX - initialLayer.width * scaleX / 2;
              }

              if ((canvasState.corner & Side.Bottom) === Side.Bottom) {
                // Scaling from top side as anchor
                newY = canvasState.initialBounds.y + relativeY * scaleY;
              } else if ((canvasState.corner & Side.Top) === Side.Top) {
                // Scaling from bottom side as anchor
                const bottomEdge = canvasState.initialBounds.y + canvasState.initialBounds.height;
                const distanceFromBottom = bottomEdge - (initialLayer.y + initialLayer.height);
                newY = newSelectionBounds.y + newSelectionBounds.height - distanceFromBottom * scaleY - initialLayer.height * scaleY;
              } else {
                // Maintain vertical center alignment
                const centerOffsetY = initialLayer.y + initialLayer.height / 2 - (canvasState.initialBounds.y + canvasState.initialBounds.height / 2);
                newY = newSelectionBounds.y + newSelectionBounds.height / 2 + centerOffsetY * scaleY - initialLayer.height * scaleY / 2;
              }

              return {
                ...layer,
                x: newX,
                y: newY,
                width: initialLayer.width * scaleX,
                height: initialLayer.height * scaleY
              };
            }
            return layer;
          }),
        );
      } else if (canvasState.mode === CanvasMode.DragSelecting) {
        setCanvasState({
          mode: CanvasMode.DragSelecting,
          origin: canvasState.origin,
          current: point,
        });
      }
    },
    [canvasState, selectedLayerIds, camera, initialLayerStates],
  );

  const onPointerUp = useCallback(() => {
    if (canvasState.mode === CanvasMode.Translating || canvasState.mode === CanvasMode.Resizing) {
      updateHistory(layers);
    } else if (canvasState.mode === CanvasMode.DragSelecting) {
      // Find all layers that intersect with the selection box
      const selectionBox = {
        x: Math.min(canvasState.origin.x, canvasState.current.x),
        y: Math.min(canvasState.origin.y, canvasState.current.y),
        width: Math.abs(canvasState.current.x - canvasState.origin.x),
        height: Math.abs(canvasState.current.y - canvasState.origin.y),
      };

      // Check for minimum drag size to avoid accidental selections
      if (selectionBox.width < 5 && selectionBox.height < 5) {
        setCanvasState({ mode: CanvasMode.None });
        return;
      }

      const selectedIds = layers.filter(layer => {
        // Using AABB collision detection (Axis-Aligned Bounding Box)
        return (
          // Check if any part of the layer is within the selection box
          layer.x < selectionBox.x + selectionBox.width &&
          layer.x + layer.width > selectionBox.x &&
          layer.y < selectionBox.y + selectionBox.height &&
          layer.y + layer.height > selectionBox.y
        );
      }).map(layer => layer.id);

      if (selectedIds.length > 0) {
        setSelectedLayerIds(selectedIds);
      }
    }
    setCanvasState({ mode: CanvasMode.None });
  }, [canvasState, layers, updateHistory]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return; // Only handle left clicks

      const point = screenToWorld(e.clientX, e.clientY);

      if (activeTool === Tool.Selection) {
        if (!e.shiftKey) {
          setSelectedLayerIds([]);
        }
        setCanvasState({
          mode: CanvasMode.DragSelecting,
          origin: point,
          current: point
        });
        return;
      }

      if (activeTool === Tool.Rectangle) {
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
        setSelectedLayerIds([newLayer.id]);
      }
    },
    [activeTool, layers, camera],
  );

  const deleteSelectedLayers = useCallback(() => {
    if (selectedLayerIds.length > 0) {
      const updatedLayers = layers.filter(layer => !selectedLayerIds.includes(layer.id));
      setLayers(updatedLayers);
      updateHistory(updatedLayers);
      setSelectedLayerIds([]);
    }
  }, [selectedLayerIds, layers, updateHistory]);

  // Handle keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when not in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelectedLayers();
      }

      // Add Ctrl+A (or Cmd+A) for select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (layers.length > 0) {
          setSelectedLayerIds(layers.map(layer => layer.id));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteSelectedLayers, layers]);

  // Calculate the combined bounding box for multiple selections
  const selectionBoundingBox = useMemo(() => {
    if (selectedLayerIds.length === 0) return null;

    const selectedLayers = layers.filter(layer => selectedLayerIds.includes(layer.id));
    if (selectedLayers.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    selectedLayers.forEach(layer => {
      minX = Math.min(minX, layer.x);
      minY = Math.min(minY, layer.y);
      maxX = Math.max(maxX, layer.x + layer.width);
      maxY = Math.max(maxY, layer.y + layer.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, [layers, selectedLayerIds]);

  return (
    <div
      className="h-full w-full relative bg-neutral-100 touch-none"
      onWheel={onWheel}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerDown={onPointerDown}
      onContextMenu={(e) => e.preventDefault()} // Prevent browser context menu
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
              onLayerContextMenu={onLayerContextMenu}
              selected={selectedLayerIds.includes(layer.id)}
            />
          ))}
          {selectedLayerIds.length === 1 && (
            <SelectionBox
              boundingBox={layers.find(l => l.id === selectedLayerIds[0])!}
              onResizeHandlePointerDown={onResizeHandlePointerDown}
            />
          )}
          {selectedLayerIds.length > 1 && selectionBoundingBox && (
            <MultiSelectionBox
              boundingBox={selectionBoundingBox}
              onResizeHandlePointerDown={onResizeHandlePointerDown}
            />
          )}
          {canvasState.mode === CanvasMode.DragSelecting && (
            <DragSelectionBox
              startPoint={canvasState.origin}
              endPoint={canvasState.current}
            />
          )}
        </g>
      </svg>
      {contextMenu && contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
          onColorSelect={handleColorChange}
        />
      )}
    </div>
  );
} 