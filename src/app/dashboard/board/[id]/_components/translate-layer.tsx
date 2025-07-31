import { useState, useRef, useCallback } from 'react';
import { useMutation } from '@/liveblocks.config';
import { Layer, Point, LayerType } from '@/types/canvas';

interface TranslateLayerProps {
  id: string;
  layer: Layer;
  isSelected: boolean;
  children: React.ReactNode;
  onTranslateStart?: () => void;
  onTranslateEnd?: () => void;
  snapToGrid?: boolean;
  gridSize?: number;
}

interface TranslateStartState {
  x: number;
  y: number;
  layerX: number;
  layerY: number;
}

/**
 * TranslateLayer - 实现图层的平移移动功能
 * 支持网格对齐和精确定位
 */
export const TranslateLayer = ({
  id,
  layer,
  isSelected,
  children,
  onTranslateStart,
  onTranslateEnd,
  snapToGrid = false,
  gridSize = 10
}: TranslateLayerProps) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const translateStartRef = useRef<TranslateStartState>({
    x: 0,
    y: 0,
    layerX: 0,
    layerY: 0
  });
  const elementRef = useRef<SVGGElement>(null);

  // 更新图层位置的mutation
  const updateLayerPosition = useMutation(
    ({ storage }, position: { x: number, y: number }) => {
      const layersMap = storage.get('layers');
      const layerData = layersMap.get(id);

      if (layerData) {
        // 对于Path类型，我们需要同时更新所有点的坐标
        if (layer.type === LayerType.Path) {
          // 使用类型断言确保TypeScript理解这是Path类型
          const pathLayer = layer as Extract<Layer, { type: LayerType.Path }>;

          // 计算位移差值
          const dx = position.x - pathLayer.x;
          const dy = position.y - pathLayer.y;

          // 如果有points属性，移动所有点
          if (pathLayer.points && pathLayer.points.length > 0) {
            const newPoints = pathLayer.points.map(point => [
              point[0] + dx,
              point[1] + dy,
              point[2]
            ]);

            layerData.update({
              x: position.x,
              y: position.y,
              points: newPoints
            });
          } else {
            // 如果没有points，只更新位置
            layerData.update({
              x: position.x,
              y: position.y
            });
          }
        } else {
          // 对于其他类型，只更新位置
          layerData.update({
            x: position.x,
            y: position.y
          });
        }
      }
    },
    [layer]
  );

  // 将坐标对齐到网格
  const snapToGridPoint = useCallback((point: Point): Point => {
    if (!snapToGrid) return point;

    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  }, [snapToGrid, gridSize]);

  // 处理平移开始
  const handleTranslateStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!isSelected) return;

    setIsTranslating(true);

    // 捕获指针
    if (elementRef.current) {
      elementRef.current.setPointerCapture(e.pointerId);
    }

    // 保存平移起始状态
    translateStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      layerX: layer.x,
      layerY: layer.y
    };

    // 调用外部开始平移回调
    if (onTranslateStart) onTranslateStart();
  }, [isSelected, layer.x, layer.y, onTranslateStart]);

  // 处理平移过程
  const handleTranslate = useCallback((e: React.PointerEvent) => {
    if (!isTranslating) return;

    // 计算移动距离
    const dx = e.clientX - translateStartRef.current.x;
    const dy = e.clientY - translateStartRef.current.y;

    // 计算新位置
    const newPosition = {
      x: translateStartRef.current.layerX + dx,
      y: translateStartRef.current.layerY + dy
    };

    // 应用网格对齐（如果启用）
    const snappedPosition = snapToGridPoint(newPosition);

    // 更新图层位置
    updateLayerPosition(snappedPosition);
  }, [isTranslating, updateLayerPosition, snapToGridPoint]);

  // 处理平移结束
  const handleTranslateEnd = useCallback((e: React.PointerEvent) => {
    if (!isTranslating) return;

    setIsTranslating(false);

    // 释放指针捕获
    if (elementRef.current && e.pointerId) {
      try {
        elementRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {
        console.error("Error releasing pointer capture", err);
      }
    }

    // 调用外部结束平移回调
    if (onTranslateEnd) onTranslateEnd();
  }, [isTranslating, onTranslateEnd]);

  return (
    <g
      ref={elementRef}
      onPointerDown={handleTranslateStart}
      onPointerMove={handleTranslate}
      onPointerUp={handleTranslateEnd}
      onPointerLeave={handleTranslateEnd}
      style={{
        cursor: isTranslating ? 'grabbing' : isSelected ? 'grab' : 'pointer',
        // 添加虚线指示器（当启用网格对齐时）
        outline: snapToGrid && isSelected ? '1px dashed rgba(0, 0, 255, 0.5)' : 'none'
      }}
    >
      {children}

      {/* 显示平移指示器（当正在平移时） */}
      {isTranslating && (
        <rect
          x={layer.x - 2}
          y={layer.y - 2}
          width={layer.width + 4}
          height={layer.height + 4}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={1}
          strokeDasharray="4,4"
          pointerEvents="none"
        />
      )}
    </g>
  );
}; 