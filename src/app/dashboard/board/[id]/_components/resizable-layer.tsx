import { useRef, useState, useCallback } from 'react';
import { useMutation } from '@/liveblocks.config';
import { Side, Layer } from '@/types/canvas';

// 定义调整大小起始状态的类型
interface ResizeStartState {
  x: number;
  y: number;
  width: number;
  height: number;
  mouseX: number;
  mouseY: number;
}

interface ResizableLayerProps {
  id: string;
  layer: Layer;
  isSelected: boolean;
  children: React.ReactNode;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
}

/**
 * 通用的图层大小调整组件，添加调整大小的控制点和拖动功能
 */
export const ResizableLayer = ({
  id,
  layer,
  isSelected,
  children,
  onResizeStart,
  onResizeEnd
}: ResizableLayerProps) => {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState<Side | null>(null);
  const resizeStartRef = useRef<ResizeStartState>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    mouseX: 0,
    mouseY: 0
  });
  const elementRef = useRef<SVGGElement>(null);

  // 获取图层属性
  const { x, y, width, height } = layer;

  // 更新图层的mutation
  const updateLayer = useMutation(
    ({ storage }, newValues: Partial<Layer>) => {
      const layersMap = storage.get('layers');
      const layerData = layersMap.get(id);

      if (layerData) {
        Object.entries(newValues).forEach(([key, value]) => {
          layerData.update({
            [key]: value
          });
        });
      }
    },
    []
  );

  // 处理调整大小开始
  const handleResizeStart = useCallback((e: React.PointerEvent, corner: Side) => {
    e.stopPropagation();
    e.preventDefault();

    setIsResizing(true);
    setResizeCorner(corner);

    // 捕获指针
    if (elementRef.current) {
      elementRef.current.setPointerCapture(e.pointerId);
    }

    // 保存起始状态，包括鼠标的起始位置
    resizeStartRef.current = {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      mouseX: e.clientX,
      mouseY: e.clientY
    };

    // 调用外部开始调整大小的回调
    if (onResizeStart) onResizeStart();
  }, [layer.x, layer.y, layer.width, layer.height, onResizeStart]);

  // 处理调整大小过程
  const handleResize = useCallback((e: React.PointerEvent) => {
    if (!isResizing || !resizeCorner) return;

    // 计算鼠标移动的距离，而不是相对于初始元素位置
    const dx = e.clientX - resizeStartRef.current.mouseX;
    const dy = e.clientY - resizeStartRef.current.mouseY;

    let newX = resizeStartRef.current.x;
    let newY = resizeStartRef.current.y;
    let newWidth = resizeStartRef.current.width;
    let newHeight = resizeStartRef.current.height;

    // 根据不同的调整点计算新的尺寸和位置
    switch (resizeCorner) {
      case Side.Top:
        newY = resizeStartRef.current.y + dy;
        newHeight = Math.max(10, resizeStartRef.current.height - dy);
        break;
      case Side.Bottom:
        // 直接使用dy来增加高度，而不是相对于初始高度
        newHeight = Math.max(10, resizeStartRef.current.height + dy);
        break;
      case Side.Left:
        newX = resizeStartRef.current.x + dx;
        newWidth = Math.max(10, resizeStartRef.current.width - dx);
        break;
      case Side.Right:
        // 直接使用dx来增加宽度，而不是相对于初始宽度
        newWidth = Math.max(10, resizeStartRef.current.width + dx);
        break;
    }

    updateLayer({
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  }, [isResizing, resizeCorner, updateLayer]);

  // 处理调整大小结束
  const handleResizeEnd = useCallback((e: React.PointerEvent) => {
    if (!isResizing) return;

    setIsResizing(false);
    setResizeCorner(null);

    // 释放指针捕获
    if (elementRef.current && e.pointerId) {
      try {
        elementRef.current.releasePointerCapture(e.pointerId);
      } catch (err) {
        console.error("Error releasing pointer capture", err);
      }
    }

    // 调用外部结束调整大小的回调
    if (onResizeEnd) onResizeEnd();
  }, [isResizing, onResizeEnd]);

  // 生成调整大小的控制点
  const renderResizeHandles = () => {
    if (!isSelected) return null;

    return (
      <>
        {/* 顶部控制点 */}
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

        {/* 底部控制点 */}
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

        {/* 左侧控制点 */}
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

        {/* 右侧控制点 */}
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
      </>
    );
  };

  return (
    <g
      ref={elementRef}
      onPointerMove={isResizing ? handleResize : undefined}
      onPointerUp={handleResizeEnd}
      onPointerLeave={handleResizeEnd}
    >
      {/* 图层内容 */}
      {children}

      {/* 调整大小的控制点 */}
      {renderResizeHandles()}

      {/* 选中时显示的边框 */}
      {isSelected && (
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill="transparent"
          stroke="#0000ff"
          strokeWidth={1}
          strokeDasharray={isResizing ? "none" : "5,5"}
          pointerEvents="none"
        />
      )}
    </g>
  );
}; 