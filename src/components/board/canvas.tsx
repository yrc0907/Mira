"use client";

import React, { useState, useCallback, WheelEvent, useMemo, useRef } from "react";
import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import { SelectionBox, Side, DragSelectionBox, MultiSelectionBox, MoveHandle } from "./selection-box";
import { ContextMenu } from "./context-menu";

// 移动手柄尺寸
const MOVE_HANDLE_SIZE = 14;

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
  Pencil,
  Moving, // 添加新的移动模式
}

type Point = { x: number; y: number };

export type Layer = {
  id: string;
  type: Tool;
  x: number;
  y: number;
  height: number;
  width: number;
  fill: string;
  points?: Point[]; // 铅笔工具的路径点
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
  }
  | {
    mode: CanvasMode.Pencil;
    origin: Point;
    current: Point;
  }
  | {
    mode: CanvasMode.Moving;
    origin: Point;
  };

interface CanvasProps {
  boardId: string;
}

export function Canvas({ boardId }: CanvasProps) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeTool, setActiveTool] = useState<Tool>(Tool.None);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });

  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
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

  // SVG元素的引用，用于准确计算坐标
  const svgRef = useRef<SVGSVGElement>(null);

  // 改进的坐标转换函数，确保准确跟踪鼠标位置
  const screenToWorld = useCallback((clientX: number, clientY: number): Point => {
    const svg = svgRef.current;
    if (svg) {
      // 获取SVG元素的位置和尺寸信息
      const svgRect = svg.getBoundingClientRect();
      // 计算点击位置相对于SVG元素左上角的坐标
      const x = clientX - svgRect.left;
      const y = clientY - svgRect.top;

      // 应用相机偏移
      return {
        x: x - camera.x,
        y: y - camera.y
      };
    }

    // 降级方案
    return {
      x: clientX - camera.x,
      y: clientY - camera.y,
    };
  }, [camera]);

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
          setSelectedLayerIds([layerId]);
        }
      }
    },
    [activeTool, camera, selectedLayerIds],
  );

  const onLayerContextMenu = useCallback(
    (e: React.MouseEvent, layerId: string) => {
      e.preventDefault();
      e.stopPropagation();

      console.log("onLayerContextMenu called for layer:", layerId);

      // 优先保留当前选择，如果没有选中目标元素，就选中它
      if (!selectedLayerIds.includes(layerId)) {
        if (e.shiftKey) {
          // Shift+右键：添加到现有选择
          setSelectedLayerIds(prev => [...prev, layerId]);
        } else {
          // 普通右键：只选择当前元素
          setSelectedLayerIds([layerId]);
        }
      }

      // 立即渲染选择状态的变化
      setTimeout(() => {
        // 显示上下文菜单
        setContextMenu({
          visible: true,
          x: e.clientX,
          y: e.clientY,
        });

        console.log("Context menu set to:", {
          visible: true,
          x: e.clientX,
          y: e.clientY
        });
      }, 0);
    },
    [selectedLayerIds],
  );

  const closeContextMenu = useCallback(() => {
    // 只关闭菜单，不清除选择
    setContextMenu(null);
  }, []);

  const handleColorChange = useCallback(
    (color: string) => {
      console.log("Color change triggered with:", color, "for layers:", selectedLayerIds);

      if (selectedLayerIds.length > 0) {
        // 保存当前选择的ID
        const currentSelection = [...selectedLayerIds];

        // 更新图层颜色
        setLayers((prevLayers) => {
          const updatedLayers = prevLayers.map((layer) => {
            if (selectedLayerIds.includes(layer.id)) {
              console.log("Updating layer color:", layer.id, "from", layer.fill, "to", color);
              return { ...layer, fill: color };
            }
            return layer;
          });

          // 确保立即保存到历史记录
          setTimeout(() => {
            updateHistory(updatedLayers);
          }, 0);

          return updatedLayers;
        });

        // 确保选择状态保持不变
        setTimeout(() => {
          setSelectedLayerIds(currentSelection);
        }, 0);

        // 关闭上下文菜单
        closeContextMenu();
      }
    },
    [selectedLayerIds, updateHistory, closeContextMenu],
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
          // 保存铅笔路径的所有点
          if (layer.type === Tool.Pencil && layer.points) {
            layerStates[id] = {
              ...layer,
              points: [...layer.points]
            };
          } else {
            layerStates[id] = { ...layer };
          }
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

  const onMoveHandlePointerDown = useCallback(
    (e: React.PointerEvent, initialBounds: { x: number; y: number; width: number; height: number }) => {
      const origin = screenToWorld(e.clientX, e.clientY);

      // 保存所有选中图层的初始状态
      const layerStates: Record<string, Layer> = {};
      selectedLayerIds.forEach(id => {
        const layer = layers.find(l => l.id === id);
        if (layer) {
          // 保存铅笔路径的所有点
          if (layer.type === Tool.Pencil && layer.points) {
            layerStates[id] = {
              ...layer,
              points: [...layer.points]
            };
          } else {
            layerStates[id] = { ...layer };
          }
        }
      });
      setInitialLayerStates(layerStates);

      // 设置画布状态为移动模式
      setCanvasState({
        mode: CanvasMode.Moving,
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
        // Start translating only if we've moved a minimum distance
        const dx = Math.abs(point.x - canvasState.origin.x);
        const dy = Math.abs(point.y - canvasState.origin.y);

        if (dx > 3 || dy > 3) {
          setCanvasState({ mode: CanvasMode.Translating, origin: point });
        }
      } else if (canvasState.mode === CanvasMode.Translating || canvasState.mode === CanvasMode.Moving) {
        // 处理移动模式和拖动模式，共用移动逻辑
        const dx = point.x - canvasState.origin.x;
        const dy = point.y - canvasState.origin.y;

        setLayers((layers) =>
          layers.map((layer) => {
            if (selectedLayerIds.includes(layer.id)) {
              // 处理铅笔路径的移动
              if (layer.type === Tool.Pencil && layer.points) {
                // 移动路径上的所有点
                const newPoints = layer.points.map(pt => ({
                  x: pt.x + dx,
                  y: pt.y + dy
                }));
                return {
                  ...layer,
                  x: layer.x + dx,
                  y: layer.y + dy,
                  points: newPoints
                };
              }
              return { ...layer, x: layer.x + dx, y: layer.y + dy };
            }
            return layer;
          }),
        );

        // 更新当前状态，保持同样的模式
        setCanvasState({
          ...canvasState,
          origin: point
        });
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

              // 处理铅笔路径的缩放
              if (layer.type === Tool.Pencil && layer.points && initialLayer.points) {
                // 计算每个点的新位置
                const newPoints = initialLayer.points.map(pt => {
                  // 计算相对于原始边界框的位置
                  const relativeX = pt.x - initialLayer.x;
                  const relativeY = pt.y - initialLayer.y;

                  // 应用缩放
                  const newRelativeX = relativeX * scaleX;
                  const newRelativeY = relativeY * scaleY;

                  // 计算新的绝对位置
                  return {
                    x: newSelectionBounds.x + newRelativeX,
                    y: newSelectionBounds.y + newRelativeY
                  };
                });

                return {
                  ...layer,
                  x: newSelectionBounds.x,
                  y: newSelectionBounds.y,
                  width: newSelectionBounds.width,
                  height: newSelectionBounds.height,
                  points: newPoints
                };
              }

              // 计算普通图形的位置
              // Determine new position based on resize direction and scaling
              let newX, newY;

              // 计算相对于初始边界框的位置
              const relativeX = initialLayer.x - canvasState.initialBounds.x;
              const relativeY = initialLayer.y - canvasState.initialBounds.y;

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
      } else if (canvasState.mode === CanvasMode.Pencil) {
        // 简化铅笔绘制逻辑，添加新点
        setCurrentPath(prevPath => [...prevPath, point]);
        setCanvasState({
          mode: CanvasMode.Pencil,
          origin: canvasState.origin,
          current: point
        });
      }
    },
    [canvasState, selectedLayerIds, camera, initialLayerStates, screenToWorld, currentPath]
  );

  // 计算路径的边界框，修复计算逻辑
  const calculatePathBounds = useCallback((points: Point[]) => {
    if (!points.length) return { x: 0, y: 0, width: 0, height: 0 };

    // 添加小的边距，确保路径不会紧贴边界
    const padding = 5;

    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;

    points.forEach(point => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    });

    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2
    };
  }, []);

  const onPointerUp = useCallback(() => {
    if (
      canvasState.mode === CanvasMode.Translating ||
      canvasState.mode === CanvasMode.Resizing ||
      canvasState.mode === CanvasMode.Moving
    ) {
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
    } else if (canvasState.mode === CanvasMode.Pencil && currentPath.length > 1) {
      // 完成绘制，创建新的路径图层
      const bounds = calculatePathBounds(currentPath);

      // 只有当路径有一定长度和宽度时才创建图层
      if (bounds.width > 3 || bounds.height > 3) {
        const newLayer: Layer = {
          id: new Date().toISOString(),
          type: Tool.Pencil,
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          fill: "black", // 默认颜色
          points: currentPath.map(pt => ({ ...pt })) // 创建点的深拷贝
        };

        const updatedLayers = [...layers, newLayer];
        setLayers(updatedLayers);
        updateHistory(updatedLayers);

        // 选中新创建的路径并切换回选择工具
        setSelectedLayerIds([newLayer.id]);
        setActiveTool(Tool.Selection);
      }

      // 清空当前路径
      setCurrentPath([]);
    }

    setCanvasState({ mode: CanvasMode.None });
  }, [canvasState, layers, updateHistory, currentPath, setActiveTool, calculatePathBounds]);

  // Helper function to check if a point is inside a layer
  const isPointInLayer = useCallback(
    (point: Point, layer: Layer): boolean => {
      if (layer.type === Tool.Circle) {
        // 对于圆形，计算点到圆心的距离
        const centerX = layer.x + layer.width / 2;
        const centerY = layer.y + layer.height / 2;
        const radiusX = layer.width / 2;
        const radiusY = layer.height / 2;

        // 计算椭圆方程 (x-h)²/a² + (y-k)²/b² ≤ 1
        const normalizedX = (point.x - centerX) / radiusX;
        const normalizedY = (point.y - centerY) / radiusY;

        return (normalizedX * normalizedX + normalizedY * normalizedY) <= 1;
      } else if (layer.type === Tool.Pencil && layer.points && layer.points.length > 0) {
        // 对于铅笔路径，检查点是否在路径附近
        const tolerance = 5; // 点击容差范围

        // 简单算法：检查点到任何线段的最短距离
        for (let i = 1; i < layer.points.length; i++) {
          const p1 = layer.points[i - 1];
          const p2 = layer.points[i];

          // 计算点到线段的最短距离
          const distance = distancePointToSegment(point, p1, p2);
          if (distance <= tolerance) {
            return true;
          }
        }
        return false;
      }

      // 默认矩形检测
      return (
        point.x >= layer.x &&
        point.x <= layer.x + layer.width &&
        point.y >= layer.y &&
        point.y <= layer.y + layer.height
      );
    },
    []
  );

  // 计算点到线段的最短距离
  const distancePointToSegment = useCallback((point: Point, p1: Point, p2: Point): number => {
    const A = point.x - p1.x;
    const B = point.y - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    } else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    } else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Find which layer contains the point
  const getLayerIdAtPoint = useCallback(
    (point: Point): string | null => {
      // Search in reverse to find the topmost layer (last rendered is on top)
      for (let i = layers.length - 1; i >= 0; i--) {
        if (isPointInLayer(point, layers[i])) {
          return layers[i].id;
        }
      }
      return null;
    },
    [layers, isPointInLayer]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return; // Only handle left clicks

      const point = screenToWorld(e.clientX, e.clientY);

      if (activeTool === Tool.Selection) {
        // First check if we clicked on a layer
        const clickedLayerId = getLayerIdAtPoint(point);

        if (clickedLayerId) {
          // If clicked on a selected layer, prepare for movement
          if (selectedLayerIds.includes(clickedLayerId)) {
            setCanvasState({ mode: CanvasMode.Pressing, origin: point });
            return;
          } else {
            // If clicked on an unselected layer, select it
            if (!e.shiftKey) {
              setSelectedLayerIds([clickedLayerId]);
            } else {
              setSelectedLayerIds(prev => [...prev, clickedLayerId]);
            }
            setCanvasState({ mode: CanvasMode.Pressing, origin: point });
            return;
          }
        }

        // If we reach here, we clicked on an empty area
        if (!e.shiftKey) {
          setSelectedLayerIds([]);
        }

        setCanvasState({
          mode: CanvasMode.DragSelecting,
          origin: point,
          current: point
        });
        return;
      } else if (activeTool === Tool.Rectangle) {
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
        return;
      } else if (activeTool === Tool.Circle) {
        const newLayer: Layer = {
          id: new Date().toISOString(),
          type: Tool.Circle,
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
        return;
      } else if (activeTool === Tool.Pencil) {
        // 开始绘制路径
        setCurrentPath([point]);
        setCanvasState({
          mode: CanvasMode.Pencil,
          origin: point,
          current: point
        });
        return;
      }
    },
    [activeTool, layers, camera, selectedLayerIds, getLayerIdAtPoint, updateHistory, screenToWorld]
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
    // 处理移动手柄的点击
    const handleMovePointerDown = (e: React.PointerEvent) => {
      e.stopPropagation();
      const origin = screenToWorld(e.clientX, e.clientY);

      // 保存当前图层的初始状态
      const layerStates: Record<string, Layer> = {};
      if (layer.type === Tool.Pencil && layer.points) {
        layerStates[layer.id] = {
          ...layer,
          points: [...layer.points]
        };
      } else {
        layerStates[layer.id] = { ...layer };
      }
      setInitialLayerStates(layerStates);

      // 设置画布状态为移动模式
      setCanvasState({
        mode: CanvasMode.Moving,
        origin,
      });
    };

    // 根据图形类型渲染不同的SVG元素
    if (layer.type === Tool.Circle) {
      return (
        <g>
          <ellipse
            onPointerDown={(e) => onLayerPointerDown(e, layer.id)}
            onContextMenu={(e) => {
              console.log("Layer context menu triggered", layer.id);
              onLayerContextMenu(e, layer.id);
            }}
            cx={layer.x + layer.width / 2}
            cy={layer.y + layer.height / 2}
            rx={layer.width / 2}
            ry={layer.height / 2}
            fill={layer.fill}
            strokeWidth={1}
            stroke={selected ? "#007bff" : "transparent"}
            className="pointer-events-auto"
          />
          {selected && (
            <MoveHandle
              x={layer.x + layer.width / 2}
              y={layer.y + layer.height / 2}
              size={MOVE_HANDLE_SIZE}
              onPointerDown={handleMovePointerDown}
            />
          )}
        </g>
      );
    } else if (layer.type === Tool.Pencil && layer.points && layer.points.length > 0) {
      // 生成SVG路径字符串
      const pathData = `M ${layer.points[0].x} ${layer.points[0].y} ${layer.points.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ')}`;

      return (
        <g>
          <path
            onPointerDown={(e) => onLayerPointerDown(e, layer.id)}
            onContextMenu={(e) => {
              console.log("Layer context menu triggered", layer.id);
              onLayerContextMenu(e, layer.id);
            }}
            d={pathData}
            fill="none"
            stroke={layer.fill}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="pointer-events-auto"
          />
          {selected && (
            <>
              <rect
                x={layer.x}
                y={layer.y}
                width={layer.width}
                height={layer.height}
                fill="transparent"
                stroke="#007bff"
                strokeWidth={1}
                strokeDasharray="3,3"
                className="pointer-events-none"
              />
              <MoveHandle
                x={layer.x + layer.width / 2}
                y={layer.y + layer.height / 2}
                size={MOVE_HANDLE_SIZE}
                onPointerDown={handleMovePointerDown}
              />
            </>
          )}
        </g>
      );
    }

    // 默认渲染矩形
    return (
      <g>
        <rect
          onPointerDown={(e) => onLayerPointerDown(e, layer.id)}
          onContextMenu={(e) => {
            console.log("Layer context menu triggered", layer.id);
            onLayerContextMenu(e, layer.id);
          }}
          x={layer.x}
          y={layer.y}
          width={layer.width}
          height={layer.height}
          fill={layer.fill}
          strokeWidth={1}
          stroke={selected ? "#007bff" : "transparent"}
          className="pointer-events-auto"
        />
        {selected && (
          <MoveHandle
            x={layer.x + layer.width / 2}
            y={layer.y + layer.height / 2}
            size={MOVE_HANDLE_SIZE}
            onPointerDown={handleMovePointerDown}
          />
        )}
      </g>
    );
  };

  // 修复铅笔路径的选择框渲染
  const getSelectedLayerBoundingBox = useCallback(() => {
    if (selectedLayerIds.length === 0) return null;

    if (selectedLayerIds.length === 1) {
      const selectedLayer = layers.find(l => l.id === selectedLayerIds[0]);
      if (!selectedLayer) return null;

      // 为铅笔路径单独处理选择框
      if (selectedLayer.type === Tool.Pencil) {
        // 铅笔路径的选择框由LayerComponent中单独处理
        return null;
      }

      // 其他普通图形使用标准选择框
      return selectedLayer;
    }

    // 多选情况
    return selectionBoundingBox;
  }, [layers, selectedLayerIds, selectionBoundingBox]);

  return (
    <div
      className="h-full w-full relative bg-neutral-100 touch-none"
      onWheel={onWheel}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerDown={onPointerDown}
      onContextMenu={(e) => {
        // 处理画布的右键菜单(仅用于非图层区域)
        e.preventDefault();
        console.log("Canvas context menu", e.target);

        // 如果在空白区域右键点击，关闭已打开的上下文菜单
        if (!e.target || (e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'div') {
          closeContextMenu();
        }
      }}
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
      <svg
        ref={svgRef}
        className="h-full w-full"
        onContextMenu={(e) => {
          // 防止svg层拦截图层的右键事件
          if ((e.target as SVGElement).tagName === 'svg') {
            e.preventDefault();
          }
        }}
      >
        <g transform={`translate(${camera.x}, ${camera.y})`}>
          {/* 渲染所有图层 */}
          {layers.map((layer) => (
            <LayerComponent
              key={layer.id}
              layer={layer}
              onLayerPointerDown={onLayerPointerDown}
              onLayerContextMenu={onLayerContextMenu}
              selected={selectedLayerIds.includes(layer.id)}
            />
          ))}

          {/* 当前正在绘制的路径 */}
          {canvasState.mode === CanvasMode.Pencil && currentPath.length > 1 && (
            <path
              d={`M ${currentPath[0].x} ${currentPath[0].y} ${currentPath.slice(1).map(point => `L ${point.x} ${point.y}`).join(' ')}`}
              fill="none"
              stroke="black"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              className="pointer-events-none"
            />
          )}

          {/* 渲染选择框 - 修改为使用新的函数获取边界盒 */}
          {selectedLayerIds.length === 1 && getSelectedLayerBoundingBox() && (
            <SelectionBox
              boundingBox={getSelectedLayerBoundingBox()!}
              onResizeHandlePointerDown={onResizeHandlePointerDown}
              onMoveHandlePointerDown={onMoveHandlePointerDown}
            />
          )}
          {selectedLayerIds.length > 1 && selectionBoundingBox && (
            <MultiSelectionBox
              boundingBox={selectionBoundingBox}
              onResizeHandlePointerDown={onResizeHandlePointerDown}
              onMoveHandlePointerDown={onMoveHandlePointerDown}
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

      {/* 上下文菜单 */}
      {contextMenu && contextMenu.visible && (
        <div
          className="absolute z-50"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            onContextMenu={e => e.preventDefault()}
            style={{
              position: 'absolute',
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              pointerEvents: 'auto',
              zIndex: 9999
            }}
          >
            <ContextMenu
              x={0}
              y={0}
              onClose={closeContextMenu}
              onColorSelect={handleColorChange}
            />
          </div>
        </div>
      )}
    </div>
  );
} 