import { useState, useRef, useCallback } from "react";
import { useMutation } from "@/liveblocks.config";
import { Layer, Side } from "@/types/canvas";
import { LiveObject } from "@liveblocks/client";

interface SelectionBoxProps {
  layers: Array<{ liveObject: LiveObject<Layer>; id: string; data: Layer; }>;
  onLayerPointerDown: (e: React.PointerEvent) => void;
}

/**
 * 为选中的多个图层显示选择框并提供群组操作功能
 */
export const SelectionBox = ({
  layers,
  onLayerPointerDown
}: SelectionBoxProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<Side | null>(null);

  // 引用用于拖动和调整大小
  const dragStartRef = useRef({
    x: 0,
    y: 0,
    layerOffsets: [] as { id: string, dx: number, dy: number }[]
  });

  const resizeStartRef = useRef({
    x: 0,
    y: 0,
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    layerData: [] as { id: string, x: number, y: number, width: number, height: number }[]
  });

  // 计算所有选中图层的边界框
  const selectionBounds = calculateSelectionBounds(layers);

  // 如果没有选择任何图层或只有一个图层，不渲染选择框
  if (!selectionBounds || layers.length <= 1) return null;

  const { x, y, width, height } = selectionBounds;

  // 批量更新图层的mutation
  const updateLayersBatch = useMutation(({ storage }, updates: { id: string, data: Partial<Layer> }[]) => {
    const layersMap = storage.get("layers");

    updates.forEach(({ id, data }) => {
      const layerData = layersMap.get(id);
      if (layerData) {
        Object.entries(data).forEach(([key, value]) => {
          layerData.update({
            [key]: value
          });
        });
      }
    });
  }, []);

  // 开始拖动所有选中图层
  const handleDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);

    if (e.currentTarget) {
      (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
    }

    // 保存拖动起始点和每个图层相对于鼠标的偏移
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      layerOffsets: layers.map((layer) => ({
        id: layer.id,
        dx: layer.data.x - e.clientX,
        dy: layer.data.y - e.clientY
      }))
    };
  };

  // 拖动过程中更新所有图层位置
  const handleDrag = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const updates = dragStartRef.current.layerOffsets.map(({ id, dx, dy }) => ({
      id,
      data: {
        x: e.clientX + dx,
        y: e.clientY + dy
      }
    }));

    updateLayersBatch(updates);
  };

  // 结束拖动
  const handleDragEnd = (e: React.PointerEvent) => {
    if (!isDragging) return;

    setIsDragging(false);

    if (e.currentTarget && e.pointerId) {
      try {
        (e.currentTarget as SVGGElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        console.error("Error releasing pointer capture", err);
      }
    }
  };

  // 开始调整大小
  const handleResizeStart = (e: React.PointerEvent, corner: Side) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeCorner(corner);

    if (e.currentTarget) {
      (e.currentTarget as SVGGElement).setPointerCapture(e.pointerId);
    }

    // 保存调整大小的起始状态
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      bounds: selectionBounds,
      layerData: layers.map(layer => ({
        id: layer.id,
        x: layer.data.x,
        y: layer.data.y,
        width: layer.data.width,
        height: layer.data.height
      }))
    };
  };

  // 调整大小过程中更新所有图层
  const handleResize = (e: React.PointerEvent) => {
    if (!isResizing || !resizeCorner) return;

    const startBounds = resizeStartRef.current.bounds;
    const dx = e.clientX - resizeStartRef.current.x;
    const dy = e.clientY - resizeStartRef.current.y;

    // 根据不同的调整角计算比例变化
    let scaleX = 1;
    let scaleY = 1;
    let translateX = 0;
    let translateY = 0;

    switch (resizeCorner) {
      case Side.Top:
        if (startBounds.height - dy > 10) {
          scaleY = (startBounds.height - dy) / startBounds.height;
          translateY = dy;
        }
        break;
      case Side.Bottom:
        if (startBounds.height + dy > 10) {
          scaleY = (startBounds.height + dy) / startBounds.height;
        }
        break;
      case Side.Left:
        if (startBounds.width - dx > 10) {
          scaleX = (startBounds.width - dx) / startBounds.width;
          translateX = dx;
        }
        break;
      case Side.Right:
        if (startBounds.width + dx > 10) {
          scaleX = (startBounds.width + dx) / startBounds.width;
        }
        break;
    }

    // 应用比例变化到所有图层
    const updates = resizeStartRef.current.layerData.map(layer => {
      // 计算图层相对于选择框原点的偏移
      const relX = layer.x - startBounds.x;
      const relY = layer.y - startBounds.y;

      // 应用缩放和平移
      return {
        id: layer.id,
        data: {
          x: startBounds.x + relX * scaleX + translateX,
          y: startBounds.y + relY * scaleY + translateY,
          width: layer.width * scaleX,
          height: layer.height * scaleY
        }
      };
    });

    updateLayersBatch(updates);
  };

  // 结束调整大小
  const handleResizeEnd = (e: React.PointerEvent) => {
    if (!isResizing) return;

    setIsResizing(false);
    setResizeCorner(null);

    if (e.currentTarget && e.pointerId) {
      try {
        (e.currentTarget as SVGGElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        console.error("Error releasing pointer capture", err);
      }
    }
  };

  return (
    <g
      onPointerDown={handleDragStart}
      onPointerMove={isResizing ? handleResize : isDragging ? handleDrag : undefined}
      onPointerUp={isResizing ? handleResizeEnd : handleDragEnd}
      onPointerLeave={isResizing ? handleResizeEnd : handleDragEnd}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* 选择框边界 */}
      <rect
        x={x - 2}
        y={y - 2}
        width={width + 4}
        height={height + 4}
        stroke="#0000ff"
        strokeWidth={1}
        fill="transparent"
        strokeDasharray="5,5"
        pointerEvents="none"
      />

      {/* 调整大小的控制点 */}
      {/* 上 */}
      <rect
        x={x + width / 2 - 5}
        y={y - 5}
        width={10}
        height={10}
        fill="white"
        stroke="#0000ff"
        strokeWidth={1}
        onPointerDown={(e) => handleResizeStart(e, Side.Top)}
        style={{ cursor: 'ns-resize' }}
      />

      {/* 下 */}
      <rect
        x={x + width / 2 - 5}
        y={y + height - 5}
        width={10}
        height={10}
        fill="white"
        stroke="#0000ff"
        strokeWidth={1}
        onPointerDown={(e) => handleResizeStart(e, Side.Bottom)}
        style={{ cursor: 'ns-resize' }}
      />

      {/* 左 */}
      <rect
        x={x - 5}
        y={y + height / 2 - 5}
        width={10}
        height={10}
        fill="white"
        stroke="#0000ff"
        strokeWidth={1}
        onPointerDown={(e) => handleResizeStart(e, Side.Left)}
        style={{ cursor: 'ew-resize' }}
      />

      {/* 右 */}
      <rect
        x={x + width - 5}
        y={y + height / 2 - 5}
        width={10}
        height={10}
        fill="white"
        stroke="#0000ff"
        strokeWidth={1}
        onPointerDown={(e) => handleResizeStart(e, Side.Right)}
        style={{ cursor: 'ew-resize' }}
      />
    </g>
  );
};

// 更新计算选中图层的边界框的函数
// 计算选中图层的边界框
function calculateSelectionBounds(layers: Array<{ data: Layer }>) {
  if (!layers.length) return null;

  try {
    // 初始值设为第一个图层的边界
    let minX = layers[0].data.x;
    let minY = layers[0].data.y;
    let maxX = layers[0].data.x + layers[0].data.width;
    let maxY = layers[0].data.y + layers[0].data.height;

    // 计算包含所有图层的最小边界
    for (const layer of layers) {
      if (!layer.data) continue;

      minX = Math.min(minX, layer.data.x);
      minY = Math.min(minY, layer.data.y);
      maxX = Math.max(maxX, layer.data.x + layer.data.width);
      maxY = Math.max(maxY, layer.data.y + layer.data.height);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  } catch (error) {
    console.error("Error calculating selection bounds:", error);
    return null;
  }
} 