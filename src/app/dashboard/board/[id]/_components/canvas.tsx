'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useMyPresence, useOthers, useHistory, useCanUndo, useCanRedo, useMutation, useStorage } from '@/liveblocks.config';
import { Participants } from './participants';
import Info from './info';
import Toolbar from './toolbar';
import { CanvasMode, CanvasState, LayerType, Point, Layer, Color, XYWH } from '@/types/canvas';
import { Cursor } from './cursor';
import { LiveObject } from '@liveblocks/client';
import { pointerEventToCanvasPoint, resizeBounds } from '@/lib/utils';
import { LayerPreview } from './layer-preview';
import { SelectionNet } from './selection-net';
import { SelectionBox } from './selection-box';
import { LayerActions } from './layer-actions';
import { Settings, Layers } from 'lucide-react';

const Cursors = () => {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId }) => (
        <Cursor
          key={connectionId}
          connectionId={connectionId}
        />
      ))}
    </>
  );
};

export function Canvas({ boardId }: { boardId: string }) {
  const [myPresence, updateMyPresence] = useMyPresence();
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });
  // 添加网格对齐状态
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [gridSize, setGridSize] = useState(20); // 默认网格大小为20px

  // 添加图层操作菜单状态
  const [showLayerActions, setShowLayerActions] = useState(false);

  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const undo = history.undo;
  const redo = history.redo;

  // Access storage with the correct types
  const layers = useStorage((root) => root.layers);
  const layerIds = useStorage((root) => root.layerIds);

  // 获取当前选中的图层
  const selectedLayerIds = myPresence.selection || [];

  // 准备选中的图层数据用于SelectionBox
  const selectedLayers = useMemo(() => {
    if (!layers || !selectedLayerIds.length) return [];

    return selectedLayerIds
      .map(id => {
        const liveObject = layers.get(id);
        if (!liveObject) return null;

        try {
          // 检查是否是LiveObject
          const isLiveObject = 'toObject' in liveObject && typeof liveObject.toObject === 'function';

          return {
            id,
            liveObject: liveObject as unknown as LiveObject<Layer>,
            data: isLiveObject
              ? (liveObject as any).toObject()
              : liveObject as unknown as Layer
          };
        } catch (error) {
          console.error("Error processing layer:", error);
          return null;
        }
      })
      .filter(Boolean) as Array<{
        id: string;
        liveObject: LiveObject<Layer>;
        data: Layer;
      }>;
  }, [layers, selectedLayerIds]);

  // 处理图层选择
  const handleLayerSelect = useCallback((layerId: string, e: React.PointerEvent) => {
    e.stopPropagation();

    // 如果按住Shift键，则将图层添加到已选择的图层列表中
    if (e.shiftKey) {
      // 如果已选择，则取消选择
      if (selectedLayerIds.includes(layerId)) {
        updateMyPresence({
          selection: selectedLayerIds.filter(id => id !== layerId)
        });
      } else {
        // 否则添加到选择列表
        updateMyPresence({
          selection: [...selectedLayerIds, layerId]
        });
      }
    } else {
      // 如果没有按Shift，则仅选择当前图层
      updateMyPresence({ selection: [layerId] });
    }

    // 当选择图层时自动显示图层选项菜单
    setShowLayerActions(true);

    setCanvasState({ mode: CanvasMode.None }); // 退出任何活动模式
  }, [updateMyPresence, selectedLayerIds]);

  // 判断图层是否在选择区域内
  const isLayerInSelectionArea = useCallback((layer: Layer, selectionArea: XYWH) => {
    // 对于Path类型，我们需要检查路径中的点是否有任何一个在选择区域内
    if (layer.type === LayerType.Path && layer.points && layer.points.length > 0) {
      // 检查是否至少有一个点在选择区域内
      return layer.points.some(([x, y]) =>
        x >= selectionArea.x &&
        x <= selectionArea.x + selectionArea.width &&
        y >= selectionArea.y &&
        y <= selectionArea.y + selectionArea.height
      );
    }

    // 对于其他类型的图层，检查是否与选择区域相交
    return (
      layer.x < selectionArea.x + selectionArea.width &&
      layer.x + layer.width > selectionArea.x &&
      layer.y < selectionArea.y + selectionArea.height &&
      layer.y + layer.height > selectionArea.y
    );
  }, []);

  // 处理选择框完成时的图层选择
  const handleSelectionComplete = useCallback((selectionArea: XYWH) => {
    if (!layers || !layerIds) return;

    const layersInSelection: string[] = [];

    layerIds.forEach(layerId => {
      const layerObj = layers.get(layerId);
      if (layerObj) {
        try {
          // 检查是否有toObject方法
          const layerData: Layer = 'toObject' in layerObj && typeof layerObj.toObject === 'function'
            ? (layerObj as any).toObject()
            : layerObj as unknown as Layer;

          if (isLayerInSelectionArea(layerData, selectionArea)) {
            layersInSelection.push(layerId);
          }
        } catch (error) {
          console.error("Error getting layer data:", error);
        }
      }
    });

    // 更新选择
    updateMyPresence({ selection: layersInSelection });

  }, [layers, layerIds, isLayerInSelectionArea, updateMyPresence]);

  const insertLayer = useMutation(
    ({ storage, setMyPresence }, layerType: LayerType, position: Point) => {
      // Generate a unique ID for the new layer
      const layerId = Date.now().toString();

      // Create the layer based on type
      let layer: Layer;

      switch (layerType) {
        case LayerType.Rectangle:
          layer = {
            type: LayerType.Rectangle,
            x: position.x,
            y: position.y,
            width: 100,
            height: 100,
            fill: lastUsedColor,
            value: "",
          };
          break;
        case LayerType.Ellipse:
          layer = {
            type: LayerType.Ellipse,
            x: position.x,
            y: position.y,
            width: 100,
            height: 100,
            fill: lastUsedColor,
            value: "",
          };
          break;
        case LayerType.Text:
          layer = {
            type: LayerType.Text,
            x: position.x,
            y: position.y,
            width: 100,
            height: 100,
            fill: lastUsedColor,
            value: "",
          };
          break;
        case LayerType.Note:
          layer = {
            type: LayerType.Note,
            x: position.x,
            y: position.y,
            width: 100,
            height: 100,
            fill: lastUsedColor,
            value: "",
          };
          break;
        default:
          return; // Unsupported layer type
      }

      // Add the new layer to storage
      storage.get("layers").set(layerId, new LiveObject(layer));
      storage.get("layerIds").push(layerId);

      // Update presence to select the new layer
      setMyPresence({
        cursor: position,
        selection: [layerId],
        pencilDraft: null,
        penColor: null
      });

      // Reset canvas mode to None after insertion
      setCanvasState({ mode: CanvasMode.None });
    },
    [lastUsedColor]
  );

  const insertPath = useMutation(
    ({ storage, self }) => {
      const pencilDraft = self.presence.pencilDraft;

      if (!pencilDraft || pencilDraft.length === 0) {
        return;
      }

      // 找到绘制区域的边界
      const minX = Math.min(...pencilDraft.map(([x]) => x));
      const minY = Math.min(...pencilDraft.map(([_, y]) => y));
      const maxX = Math.max(...pencilDraft.map(([x]) => x));
      const maxY = Math.max(...pencilDraft.map(([_, y]) => y));

      // 确保绘制区域有最小尺寸
      const width = Math.max(maxX - minX, 5);
      const height = Math.max(maxY - minY, 5);

      // 生成图层ID
      const layerId = Date.now().toString();

      // 创建路径图层 - 直接使用原始坐标，不进行偏移
      const layer: Layer = {
        type: LayerType.Path,
        x: 0,  // 不再使用minX作为偏移
        y: 0,  // 不再使用minY作为偏移
        width: Math.max(maxX, 5),  // 使用绝对坐标的最大值
        height: Math.max(maxY, 5), // 使用绝对坐标的最大值
        fill: lastUsedColor,
        points: pencilDraft.map(([x, y, pressure]) => [
          x,  // 保留原始x坐标
          y,  // 保留原始y坐标
          pressure
        ]),
        value: "",
      };

      // 将路径添加到存储中
      storage.get("layers").set(layerId, new LiveObject(layer));
      storage.get("layerIds").push(layerId);

      // 清除铅笔草稿
      updateMyPresence({
        pencilDraft: null,
        // 选择新创建的图层
        selection: [layerId]
      });

      // 自动显示图层选项菜单
      setShowLayerActions(true);
    },
    [lastUsedColor, updateMyPresence]
  );

  const startDrawing = useCallback(
    (point: Point) => {
      setCanvasState({ mode: CanvasMode.Pencil });

      // 开始绘制，记录初始点和笔触压力
      // 确保使用绝对坐标，不进行任何偏移
      updateMyPresence({
        pencilDraft: [[point.x, point.y, 1]],
        penColor: `rgb(${lastUsedColor.r}, ${lastUsedColor.g}, ${lastUsedColor.b})`
      });
    },
    [updateMyPresence, lastUsedColor]
  );

  const continueDrawing = useCallback(
    (point: Point, pressure: number = 1) => {
      if (canvasState.mode !== CanvasMode.Pencil) {
        return;
      }

      const { pencilDraft } = myPresence;

      if (!pencilDraft) {
        return;
      }

      // 添加新的点到铅笔草稿中，包括笔触压力
      // 如果设备支持笔压，使用传入的pressure值
      updateMyPresence({
        pencilDraft: [...pencilDraft, [point.x, point.y, pressure]]
      });
    },
    [canvasState.mode, myPresence, updateMyPresence]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const point = pointerEventToCanvasPoint(e);

      updateMyPresence({ cursor: point });

      // 根据不同的模式处理指针移动
      switch (canvasState.mode) {
        case CanvasMode.Pencil:
          // 获取笔触压力，如果设备支持
          const pressure = e.pressure !== 0 ? e.pressure : 1;
          // 确保点的坐标是相对于视口的绝对坐标
          continueDrawing(point, pressure);
          break;
        case CanvasMode.SelectionNet:
          // 更新选择框的当前点
          setCanvasState({
            mode: CanvasMode.SelectionNet,
            origin: (canvasState as { mode: CanvasMode.SelectionNet; origin: Point }).origin,
            current: point
          });
          break;
      }
    },
    [canvasState, continueDrawing, updateMyPresence]
  );

  const onPointerLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    // Handle zoom or pan functionality if needed
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e);

      // Handle different canvas modes
      switch (canvasState.mode) {
        case CanvasMode.Inserting:
          if ('layerType' in canvasState) {
            insertLayer(canvasState.layerType, point);
          }
          break;
        case CanvasMode.Pencil:
          // 确保使用绝对坐标开始绘制
          startDrawing(point);
          break;
        default:
          // 如果点击的是空白区域，开始选择框
          if (e.target === e.currentTarget) {
            // 清除当前选择
            if (!e.shiftKey) {
              updateMyPresence({ selection: [] });
            }

            // 开始一个新的选择框
            setCanvasState({
              mode: CanvasMode.SelectionNet,
              origin: point
            });
          }
          break;
      }
    },
    [canvasState, insertLayer, startDrawing, updateMyPresence]
  );

  const onPointerUp = useCallback(() => {
    // 如果我们正在绘制，插入路径
    if (canvasState.mode === CanvasMode.Pencil) {
      insertPath();
      setCanvasState({ mode: CanvasMode.None });
    }
    // 如果我们正在创建选择框
    else if (canvasState.mode === CanvasMode.SelectionNet) {
      const { origin, current } = canvasState as { mode: CanvasMode.SelectionNet; origin: Point; current?: Point };

      if (current) {
        // 计算选择区域
        const selectionArea = {
          x: Math.min(origin.x, current.x),
          y: Math.min(origin.y, current.y),
          width: Math.abs(current.x - origin.x),
          height: Math.abs(current.y - origin.y)
        };

        // 选择区域内的图层
        handleSelectionComplete(selectionArea);
      }

      // 结束选择模式
      setCanvasState({ mode: CanvasMode.None });
    }
  }, [canvasState, insertPath, handleSelectionComplete]);

  // 切换网格对齐功能
  const toggleSnapToGrid = useCallback(() => {
    setSnapToGrid(prev => !prev);
  }, []);

  // 处理键盘删除快捷键
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerIds.length > 0) {
      // 不在输入框内才执行删除操作
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // 删除选中的图层
      deleteLayers(selectedLayerIds);

      // 清除选择
      updateMyPresence({ selection: [] });
    }
  }, [selectedLayerIds, updateMyPresence]);

  // 删除图层的mutation
  const deleteLayers = useMutation(({ storage }, ids: string[]) => {
    const layers = storage.get("layers");
    const layerIdsList = storage.get("layerIds");

    ids.forEach(id => {
      const index = layerIdsList.indexOf(id);
      if (index !== -1) {
        layerIdsList.delete(index);
      }

      if (layers.has(id)) {
        layers.delete(id);
      }
    });
  }, []);

  // 监听键盘事件
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 处理删除选中的图层
  const handleDeleteLayers = useCallback(() => {
    if (selectedLayerIds.length === 0) return;

    deleteLayers(selectedLayerIds);
    updateMyPresence({ selection: [] });
  }, [selectedLayerIds, deleteLayers, updateMyPresence]);

  // 处理打开颜色选择器
  const handleOpenColorPicker = useCallback(() => {
    setShowLayerActions(true);
  }, []);

  // 检查是否应该显示图层操作菜单（当有选中的图层时）
  const shouldShowLayerActions = selectedLayerIds.length > 0;

  // 创建平滑路径的辅助函数
  const createSmoothPath = (points: number[][]): string => {
    if (points.length < 2) {
      return points.length === 1
        ? `M ${points[0][0]},${points[0][1]}`
        : "";
    }

    let path = `M ${points[0][0]},${points[0][1]}`;

    // 使用贝塞尔曲线创建平滑路径
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i][0] + points[i + 1][0]) / 2;
      const yc = (points[i][1] + points[i + 1][1]) / 2;
      path += ` Q ${points[i][0]},${points[i][1]} ${xc},${yc}`;
    }

    // 添加最后一个点
    const lastPoint = points[points.length - 1];
    path += ` L ${lastPoint[0]},${lastPoint[1]}`;

    return path;
  };

  // Render the current user's pencil draft
  const pencilDraft = myPresence.pencilDraft;
  const pencilPathData = useMemo(() => {
    if (!pencilDraft || pencilDraft.length === 0) {
      return "";
    }

    return createSmoothPath(pencilDraft);
  }, [pencilDraft]);

  return (
    <main
      className="h-full w-full relative bg-neutral-100 touch-none"
      onPointerMove={(e) => {
        e.preventDefault();
        const point = pointerEventToCanvasPoint(e);
        updateMyPresence({ cursor: point });
      }}
      onPointerLeave={() => {
        updateMyPresence({ cursor: null });
      }}
    >
      <Info />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        canRedo={canRedo}
        canUndo={canUndo}
        undo={undo}
        redo={redo}
        snapToGrid={snapToGrid}
        toggleSnapToGrid={toggleSnapToGrid}
        hasSelectedLayers={selectedLayerIds.length > 0}
        onDeleteLayers={handleDeleteLayers}
        onOpenColorPicker={handleOpenColorPicker}
      />

      {/* 图层操作菜单 */}
      <div className="absolute top-5 right-5 flex items-start z-50">
        <div className="relative">
          <button
            className="bg-white rounded-md shadow-md p-3 text-sm font-medium flex items-center gap-2 hover:bg-blue-50 transition-colors border border-blue-200"
            onClick={() => {
              // 确保点击按钮时可以切换菜单显示状态
              setShowLayerActions(!showLayerActions);
            }}
            aria-label="图层操作菜单"
          >
            <Layers className="h-5 w-5 text-blue-500" />
            <span className="whitespace-nowrap">{showLayerActions ? "隐藏选项" : "图层选项"}</span>
          </button>

          {showLayerActions && selectedLayerIds.length > 0 && (
            <LayerActions
              layerIds={selectedLayerIds}
              onClose={() => {
                // 不要在操作图层后自动关闭菜单
                // setShowLayerActions(false);
              }}
            />
          )}
        </div>
      </div>

      {/* 当有图层被选中时，显示提示 */}
      {selectedLayerIds.length > 0 && !showLayerActions && selectedLayerIds.length === 1 && (
        <div
          className="absolute top-16 right-5 bg-black bg-opacity-70 text-white p-2 rounded-md text-xs z-40"
          style={{
            animation: "fadeIn 0.3s ease-in-out",
            animationFillMode: "forwards"
          }}
        >
          <p>已选择 {selectedLayerIds.length} 个图层</p>
          <p>点击右上角的<span className="font-bold">"图层选项"</span>编辑图层</p>
        </div>
      )}

      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <g>
          {/* Render all saved layers */}
          {layerIds?.map((layerId: string) => {
            const layer = layers?.get(layerId);
            if (!layer) return null;

            // 检查当前图层是否被选中
            const isSelected = selectedLayerIds.includes(layerId);

            // 直接使用layer对象，不再尝试调用toObject方法
            return (
              <LayerPreview
                key={layerId}
                layer={layer}
                layerId={layerId}
                isSelected={isSelected}
                onLayerSelect={handleLayerSelect}
                snapToGrid={snapToGrid}
                gridSize={gridSize}
              />
            );
          })}

          {/* 渲染选择框组件 */}
          {canvasState.mode === CanvasMode.None && selectedLayers.length > 1 && (
            <SelectionBox
              layers={selectedLayers}
              onLayerPointerDown={onPointerDown}
            />
          )}

          {/* 渲染选择网格 */}
          {canvasState.mode === CanvasMode.SelectionNet && 'origin' in canvasState && (
            <SelectionNet
              origin={canvasState.origin}
              current={canvasState.current}
            />
          )}

          {/* Render current pencil draft */}
          {pencilDraft && pencilDraft.length > 0 && (
            <path
              d={pencilPathData}
              stroke={myPresence.penColor || "black"}
              strokeWidth="2"
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          <Cursors />
        </g>
      </svg>
    </main>
  );
}