import React, { useState, useRef, useCallback } from 'react';
import { Layer, LayerType, Point, Side } from '@/types/canvas';
import { PencilHelpers, PencilPoint } from './pencil-tool';
import { useMutation } from '@/liveblocks.config';

interface PathRendererProps {
  id: string;
  layer: Layer;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
}

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  startLayerX: number;
  startLayerY: number;
}

interface ResizeState {
  isResizing: boolean;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  startLayerX: number; // 添加图层起始x坐标
  startLayerY: number; // 添加图层起始y坐标
  corner: Side | null;
}

/**
 * 路径渲染器组件 - 专门处理Path类型图层的渲染和交互
 * 包含独立的拖动和调整大小实现，确保路径图层可以正确操作
 */
export const PathRenderer = ({
  id,
  layer,
  isSelected,
  onSelect
}: PathRendererProps) => {
  if (layer.type !== LayerType.Path || !layer.points || layer.points.length === 0) {
    return null;
  }

  // 获取图层基本信息
  const { x: layerX, y: layerY, width, height } = layer;
  const points = layer.points as PencilPoint[];

  // 拖动状态引用
  const dragRef = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startLayerX: 0,
    startLayerY: 0
  });

  // 调整大小状态引用
  const resizeRef = useRef<ResizeState>({
    isResizing: false,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLayerX: 0, // 初始化
    startLayerY: 0, // 初始化
    corner: null
  });

  // 更新图层位置的mutation
  const updatePosition = useMutation(
    ({ storage }, newPosition: { x: number, y: number }) => {
      const layersMap = storage.get('layers');
      const layerData = layersMap.get(id);

      if (layerData) {
        layerData.update({
          x: newPosition.x,
          y: newPosition.y
        });
      }
    },
    [id]
  );

  // 更新图层大小的mutation
  const updateSize = useMutation(
    ({ storage }, newSize: { width: number, height: number }) => {
      const layersMap = storage.get('layers');
      const layerData = layersMap.get(id);

      if (layerData && layer.type === LayerType.Path) {
        const { width: newWidth, height: newHeight } = newSize;

        // 计算缩放比例
        const scaleX = newWidth / layer.width;
        const scaleY = newHeight / layer.height;

        // 应用缩放比例到所有点
        const scaledPoints = points.map(([px, py, pressure]) => [
          px * scaleX, // 缩放X坐标
          py * scaleY, // 缩放Y坐标
          pressure
        ] as PencilPoint);

        // 更新图层数据
        layerData.update({
          width: newWidth,
          height: newHeight,
          points: scaledPoints
        });
      }
    },
    [id, layer, points]
  );

  // 更新图层位置和大小的mutation
  const updatePositionAndSize = useMutation(
    ({ storage }, updates: {
      x: number,
      y: number,
      width: number,
      height: number,
      points: PencilPoint[]
    }) => {
      const layersMap = storage.get('layers');
      const layerData = layersMap.get(id);

      if (layerData) {
        layerData.update(updates);
      }
    },
    [id]
  );

  // 辅助函数：更新点坐标以适应位置变化
  const updatePointsForPositionChange = (
    originalPoints: PencilPoint[],
    oldX: number,
    oldY: number,
    newX: number,
    newY: number
  ): PencilPoint[] => {
    // 计算位置变化量
    const dx = newX - oldX;
    const dy = newY - oldY;

    // 由于路径点是相对于左上角的，当左上角移动时，
    // 我们需要调整点的相对位置以保持路径形状不变
    return originalPoints.map(([x, y, pressure]) => [
      x - dx, // 减去dx以保持绝对位置不变
      y - dy, // 减去dy以保持绝对位置不变
      pressure
    ] as PencilPoint);
  };

  // 将路径点转换为绝对坐标
  const absolutePoints = points.map(([x, y, pressure]) => [
    x + layerX,
    y + layerY,
    pressure
  ] as PencilPoint);

  // 创建可视路径
  const visiblePath = PencilHelpers.createSmoothPath(absolutePoints);

  // 获取路径颜色
  const strokeColor = `rgb(${layer.fill.r}, ${layer.fill.g}, ${layer.fill.b})`;

  // 处理选择事件
  const handleSelect = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // 确保事件对象上有正确的图层ID
    Object.defineProperty(e.target, 'dataset', {
      value: { layerId: id },
      writable: true
    });

    if (!isSelected) {
      onSelect(e);
    } else {
      // 如果已选中则开始拖动
      handleDragStart(e);
    }
  };

  // 开始拖动
  const handleDragStart = (e: React.PointerEvent) => {
    e.stopPropagation();

    // 设置拖动状态
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startLayerX: layerX,
      startLayerY: layerY
    };

    // 捕获指针以便接收后续的移动事件
    if (e.currentTarget) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    // 添加临时事件监听器
    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', handleDragEnd);
  };

  // 拖动过程
  const handleDragMove = (e: PointerEvent) => {
    if (!dragRef.current.isDragging) return;

    // 计算移动的距离
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    // 计算新位置
    const newX = dragRef.current.startLayerX + dx;
    const newY = dragRef.current.startLayerY + dy;

    // 更新图层位置
    updatePosition({ x: newX, y: newY });
  };

  // 结束拖动
  const handleDragEnd = (e: PointerEvent) => {
    if (!dragRef.current.isDragging) return;

    // 重置拖动状态
    dragRef.current.isDragging = false;

    // 清除临时事件监听器
    window.removeEventListener('pointermove', handleDragMove);
    window.removeEventListener('pointerup', handleDragEnd);
  };

  // 开始调整大小
  const handleResizeStart = (e: React.PointerEvent, corner: Side) => {
    e.stopPropagation();
    e.preventDefault();

    // 设置调整大小状态
    resizeRef.current = {
      isResizing: true,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: width,
      startHeight: height,
      startLayerX: layerX, // 保存初始位置
      startLayerY: layerY, // 保存初始位置
      corner
    };

    // 捕获指针
    if (e.currentTarget) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    // 添加临时事件监听器
    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', handleResizeEnd);
  };

  // 调整大小过程
  const handleResizeMove = (e: PointerEvent) => {
    if (!resizeRef.current.isResizing || !resizeRef.current.corner) return;

    // 当前鼠标位置
    const currentMouseX = e.clientX;
    const currentMouseY = e.clientY;

    // 初始值
    const {
      startX: initialMouseX,
      startY: initialMouseY,
      startWidth: initialWidth,
      startHeight: initialHeight,
      startLayerX: initialLayerX,
      startLayerY: initialLayerY,
      corner
    } = resizeRef.current;

    // 鼠标移动距离
    const mouseDeltaX = currentMouseX - initialMouseX;
    const mouseDeltaY = currentMouseY - initialMouseY;

    // 新的位置和尺寸
    let newX = initialLayerX;
    let newY = initialLayerY;
    let newWidth = initialWidth;
    let newHeight = initialHeight;

    // 根据调整点计算新的位置和尺寸
    switch (corner) {
      case Side.Right:
        // 右侧调整 - 只改变宽度
        newWidth = Math.max(20, initialWidth + mouseDeltaX);
        break;

      case Side.Bottom:
        // 底部调整 - 只改变高度
        newHeight = Math.max(20, initialHeight + mouseDeltaY);
        break;

      case Side.Left:
        // 左侧调整 - 保持右边界固定
        // 计算新宽度 - 向左拖动增加宽度
        const widthChange = -mouseDeltaX; // 负号使向左为正
        newWidth = Math.max(20, initialWidth + widthChange);

        // 保持右边界不变，左边界向左移动
        // 右边界位置 = 初始x + 初始宽度
        // 新左边界位置 = 右边界位置 - 新宽度
        const rightEdge = initialLayerX + initialWidth;
        newX = rightEdge - newWidth;
        break;

      case Side.Top:
        // 顶部调整 - 保持底边界固定
        // 计算新高度 - 向上拖动增加高度
        const heightChange = -mouseDeltaY; // 负号使向上为正
        newHeight = Math.max(20, initialHeight + heightChange);

        // 保持底边界不变，顶边界向上移动
        // 底边界位置 = 初始y + 初始高度
        // 新顶边界位置 = 底边界位置 - 新高度
        const bottomEdge = initialLayerY + initialHeight;
        newY = bottomEdge - newHeight;
        break;
    }

    // 如果位置或尺寸有变化
    if (newX !== layerX || newY !== layerY || newWidth !== width || newHeight !== height) {
      console.log(`Resizing: ${corner} - New pos: ${newX},${newY} - New size: ${newWidth}x${newHeight}`);

      // 将所有点转换为绝对坐标
      const absPoints = points.map(([x, y, pressure]) => [
        x + layerX,
        y + layerY,
        pressure
      ] as PencilPoint);

      // 计算缩放比例
      const scaleX = newWidth / width;
      const scaleY = newHeight / height;

      // 计算原点变化
      const originDeltaX = newX - layerX;
      const originDeltaY = newY - layerY;

      // 应用缩放和位置调整后转回相对坐标
      const newPoints = absPoints.map(([x, y, pressure]) => {
        // 转为图层原点为中心的坐标
        const centerX = x - (layerX + width / 2);
        const centerY = y - (layerY + height / 2);

        // 缩放
        const scaledX = centerX * scaleX;
        const scaledY = centerY * scaleY;

        // 转回绝对坐标，加上新的中心点
        const newAbsX = scaledX + (newX + newWidth / 2);
        const newAbsY = scaledY + (newY + newHeight / 2);

        // 转为相对于新图层左上角的坐标
        return [
          newAbsX - newX,
          newAbsY - newY,
          pressure
        ] as PencilPoint;
      });

      // 一次性更新图层的所有属性
      updatePositionAndSize({
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        points: newPoints
      });
    }
  };

  // 结束调整大小
  const handleResizeEnd = (e: PointerEvent) => {
    if (!resizeRef.current.isResizing) return;

    // 重置状态
    resizeRef.current.isResizing = false;
    resizeRef.current.corner = null;

    // 清除事件监听器
    window.removeEventListener('pointermove', handleResizeMove);
    window.removeEventListener('pointerup', handleResizeEnd);
  };

  return (
    <g>
      {/* 选择区域 - 用于拖动的透明区域，必须在最前面以接收事件 */}
      <rect
        data-layer-id={id}
        x={layerX}
        y={layerY}
        width={width}
        height={height}
        fill="transparent"
        stroke={isSelected ? "#00A0FF" : "transparent"}
        strokeWidth="1"
        strokeDasharray={isSelected ? "2,2" : "0"}
        onPointerDown={handleSelect}
        style={{
          cursor: isSelected ? 'move' : 'pointer',
          pointerEvents: 'all' // 确保所有指针事件都被捕获
        }}
      />

      {/* 可见路径 */}
      <path
        d={visiblePath}
        stroke={strokeColor}
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ pointerEvents: 'none' }}
      />

      {/* 调整大小控制点 - 只在选中时显示 */}
      {isSelected && (
        <>
          {/* 右侧调整点 */}
          <rect
            x={layerX + width - 5}
            y={layerY + height / 2 - 5}
            width={10}
            height={10}
            fill="white"
            stroke="#00A0FF"
            strokeWidth={1}
            onPointerDown={(e) => handleResizeStart(e, Side.Right)}
            style={{ cursor: 'ew-resize', pointerEvents: 'all' }}
          />

          {/* 底部调整点 */}
          <rect
            x={layerX + width / 2 - 5}
            y={layerY + height - 5}
            width={10}
            height={10}
            fill="white"
            stroke="#00A0FF"
            strokeWidth={1}
            onPointerDown={(e) => handleResizeStart(e, Side.Bottom)}
            style={{ cursor: 'ns-resize', pointerEvents: 'all' }}
          />

          {/* 左侧调整点 */}
          <rect
            x={layerX - 5}
            y={layerY + height / 2 - 5}
            width={10}
            height={10}
            fill="white"
            stroke="#00A0FF"
            strokeWidth={1}
            onPointerDown={(e) => handleResizeStart(e, Side.Left)}
            style={{ cursor: 'ew-resize', pointerEvents: 'all' }}
          />

          {/* 顶部调整点 */}
          <rect
            x={layerX + width / 2 - 5}
            y={layerY - 5}
            width={10}
            height={10}
            fill="white"
            stroke="#00A0FF"
            strokeWidth={1}
            onPointerDown={(e) => handleResizeStart(e, Side.Top)}
            style={{ cursor: 'ns-resize', pointerEvents: 'all' }}
          />

          {/* 调试信息 */}
          <text
            x={layerX}
            y={layerY - 10}
            fontSize="10"
            fill="blue"
            style={{ pointerEvents: 'none' }}
          >
            {Math.floor(width)}x{Math.floor(height)}
          </text>
        </>
      )}
    </g>
  );
}; 