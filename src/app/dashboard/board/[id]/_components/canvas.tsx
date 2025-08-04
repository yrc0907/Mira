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
import { PencilTool, PencilHelpers, PencilPoint } from './pencil-tool';

// 添加笔画类型和粗细枚举
export enum PencilStyle {
  Solid = "solid",
  Dashed = "dashed",
  Dotted = "dotted"
}

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

  // 添加笔画粗细和类型状态
  const [pencilThickness, setPencilThickness] = useState<number>(3); // 默认粗细为3
  const [pencilStyle, setPencilStyle] = useState<PencilStyle>(PencilStyle.Solid); // 默认实线

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
    e.preventDefault(); // 防止事件冒泡

    // 确保选中的是当前图层
    const targetLayerId = (e.target as HTMLElement).dataset.layerId || layerId;
    const selection = myPresence.selection || []; // 添加空值检查，如果selection为undefined则使用空数组

    // 打印调试信息
    console.log("选中图层:", targetLayerId, "当前点击元素:", e.target);

    // Shift-click: add or remove from selection
    if (e.shiftKey) {
      const newSelection = selection.includes(targetLayerId)
        ? selection.filter(id => id !== targetLayerId)
        : [...selection, targetLayerId];

      updateMyPresence({ selection: newSelection });
    }
    // Regular click - 只选择点击的那一个图层
    else {
      // If the layer is already selected, do nothing
      if (selection.length === 1 && selection[0] === targetLayerId) {
        return;
      }
      // Otherwise, select only the clicked layer
      updateMyPresence({ selection: [targetLayerId] });
    }

    // 切换到None模式以便能拖动和调整图层大小
    setCanvasState({ mode: CanvasMode.None });

    // 显示图层选项菜单
    setShowLayerActions(true);
  }, [myPresence, updateMyPresence, setCanvasState, setShowLayerActions]);

  // 判断图层是否在选择区域内
  const isLayerInSelectionArea = useCallback((layer: Layer, selectionArea: XYWH) => {
    // 对于Path类型，需要考虑路径的相对坐标
    if (layer.type === LayerType.Path && layer.points && layer.points.length > 0) {
      // 图层的基本位置和大小
      const { x: layerX, y: layerY } = layer;

      // 获取相对坐标的点
      const relativePoints = layer.points as PencilPoint[];

      // 将点转换为绝对坐标
      const absolutePoints = PencilHelpers.toAbsolutePoints(
        relativePoints,
        layerX,
        layerY
      );

      // 计算绝对坐标的边界
      const bounds = PencilHelpers.getPathBounds(absolutePoints);

      // 检查路径边界是否与选择区域相交
      const isOverlapping =
        bounds.minX <= selectionArea.x + selectionArea.width &&
        bounds.maxX >= selectionArea.x &&
        bounds.minY <= selectionArea.y + selectionArea.height &&
        bounds.maxY >= selectionArea.y;

      return isOverlapping;
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
      const pencilDraft = self.presence.pencilDraft as PencilPoint[] | null;
      const penThickness = self.presence.penThickness || 3; // Default to 3 if not set
      const penStyle = self.presence.penStyle || PencilStyle.Solid; // Default to solid

      if (!pencilDraft || pencilDraft.length === 0) {
        return;
      }

      // 精确计算路径边界
      const minX = Math.min(...pencilDraft.map(([x]) => x));
      const minY = Math.min(...pencilDraft.map(([_, y]) => y));
      const maxX = Math.max(...pencilDraft.map(([x]) => x));
      const maxY = Math.max(...pencilDraft.map(([_, y]) => y));

      // 确保宽高有合理的最小值
      const width = Math.max(maxX - minX, 1);
      const height = Math.max(maxY - minY, 1);

      // 生成图层ID
      const layerId = Date.now().toString();

      // 记录原始点坐标（相对于图层原点的偏移）
      const pointsRelative = pencilDraft.map(([x, y, pressure]) => [
        x - minX, // 将x坐标转换为相对于图层左上角的偏移
        y - minY, // 将y坐标转换为相对于图层左上角的偏移
        pressure || 1
      ] as PencilPoint);

      // 创建路径图层 - 使用精确的边界
      const layer: Layer = {
        type: LayerType.Path,
        x: minX, // 使用最小x作为图层左上角
        y: minY, // 使用最小y作为图层左上角
        width: width, // 精确宽度
        height: height, // 精确高度
        fill: lastUsedColor,
        points: pointsRelative, // 存储相对坐标
        value: "",
        penThickness, // 添加笔画粗细属性
        penStyle,     // 添加笔画样式属性
      };

      // 将路径添加到存储中
      storage.get("layers").set(layerId, new LiveObject(layer));
      storage.get("layerIds").push(layerId);

      // 清除铅笔草稿并选中新创建的图层
      updateMyPresence({
        pencilDraft: null,
        selection: [layerId],
        penColor: null
      });

      // 设置回None模式，允许选择
      setCanvasState({ mode: CanvasMode.None });

      // 显示图层选项菜单
      setShowLayerActions(true);
    },
    [lastUsedColor, updateMyPresence, setCanvasState, setShowLayerActions]
  );

  const startDrawing = useCallback(
    (point: Point) => {
      // Make sure the canvas state is set to Pencil mode
      setCanvasState({ mode: CanvasMode.Pencil });

      // 开始绘制，设置初始点
      updateMyPresence({
        pencilDraft: [[point.x, point.y, 1]] as PencilPoint[],
        penColor: `rgb(${lastUsedColor.r}, ${lastUsedColor.g}, ${lastUsedColor.b})`,
        penThickness: pencilThickness,
        penStyle: pencilStyle,
        selection: [] // Clear selection when starting to draw
      });
    },
    [updateMyPresence, lastUsedColor, pencilThickness, pencilStyle, setCanvasState]
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

      // 添加新的点到铅笔草稿中
      const newPoint: PencilPoint = [point.x, point.y, pressure];
      updateMyPresence({
        pencilDraft: [...pencilDraft, newPoint]
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

      // 如果当前模式是铅笔，开始绘制
      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point);
        return;
      }

      // Handle different canvas modes
      switch (canvasState.mode) {
        case CanvasMode.Inserting:
          if ('layerType' in canvasState) {
            insertLayer(canvasState.layerType, point);
          }
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
      // 不需要在这里设置为None模式，因为insertPath已经设置了
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
  }, [canvasState, insertPath, handleSelectionComplete, setCanvasState]);

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

  // 使用PencilTool组件渲染铅笔草稿
  const pencilDraft = myPresence.pencilDraft;
  const pencilColor = myPresence.penColor;
  const penThickness = myPresence.penThickness || pencilThickness;
  const penStyle = myPresence.penStyle || pencilStyle;

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
        pencilThickness={pencilThickness}
        setPencilThickness={setPencilThickness}
        pencilStyle={pencilStyle}
        setPencilStyle={setPencilStyle}
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
          {/* 渲染所有图层 */}
          {layerIds?.map((layerId: string) => {
            const layer = layers?.get(layerId);
            if (!layer) return null;

            // 检查当前图层是否被选中
            const isSelected = selectedLayerIds.includes(layerId);

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

          {/* 使用新的PencilTool组件渲染铅笔草稿 */}
          <PencilTool
            points={pencilDraft}
            penColor={pencilColor}
            penThickness={penThickness}
            penStyle={penStyle}
          />

          <Cursors />
        </g>
      </svg>
    </main>
  );
}