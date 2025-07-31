import { useRef, useState, useCallback } from 'react';
import { useMutation } from '@/liveblocks.config';
import { Layer } from '@/types/canvas';

interface DraggableLayerProps {
  id: string;
  layer: Layer;
  isSelected: boolean;
  children: React.ReactNode;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

/**
 * 通用的图层拖动组件
 */
export const DraggableLayer = ({
  id,
  layer,
  isSelected,
  children,
  onDragStart,
  onDragEnd
}: DraggableLayerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, layerX: 0, layerY: 0 });
  const elementRef = useRef<SVGGElement>(null);

  // 获取图层属性
  const { x, y } = layer;

  // 更新图层位置的mutation
  const updateLayerPosition = useMutation(
    ({ storage }, position: { x: number, y: number }) => {
      const layersMap = storage.get('layers');
      const layerData = layersMap.get(id);

      if (layerData) {
        layerData.update({
          x: position.x,
          y: position.y
        });
      }
    },
    []
  );

  // 处理拖动开始
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    if (!isSelected) return;

    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);

    // 捕获指针
    if (elementRef.current) {
      elementRef.current.setPointerCapture(e.pointerId);
    }

    // 保存拖动起始位置
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      layerX: x,
      layerY: y
    };

    // 调用外部拖动开始回调
    if (onDragStart) onDragStart();
  }, [isSelected, x, y, onDragStart]);

  // 处理拖动过程
  const handleDrag = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    // 计算移动距离
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // 更新位置
    updateLayerPosition({
      x: dragStartRef.current.layerX + dx,
      y: dragStartRef.current.layerY + dy
    });
  }, [isDragging, updateLayerPosition]);

  // 处理拖动结束
  const handleDragEnd = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    setIsDragging(false);

    // 释放指针捕获
    if (elementRef.current && e.pointerId) {
      try {
        elementRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {
        console.error("Error releasing pointer capture", err);
      }
    }

    // 调用外部拖动结束回调
    if (onDragEnd) onDragEnd();
  }, [isDragging, onDragEnd]);

  return (
    <g
      ref={elementRef}
      onPointerDown={handleDragStart}
      onPointerMove={handleDrag}
      onPointerUp={handleDragEnd}
      onPointerLeave={handleDragEnd}
      style={{ cursor: isDragging ? 'grabbing' : isSelected ? 'grab' : 'pointer' }}
    >
      {children}
    </g>
  );
}; 