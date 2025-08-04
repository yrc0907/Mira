import React from 'react';
import { Layer, LayerType } from '@/types/canvas';
import { PencilHelpers, PencilPoint } from './pencil-tool';

interface PathRendererProps {
  id: string;
  layer: Layer;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
}

/**
 * 路径渲染器组件 - 专门处理Path类型图层的渲染和交互
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
    }
  };

  return (
    <g>
      {/* 选择区域 - 紧贴路径边界 */}
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
        style={{ cursor: 'pointer' }}
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
    </g>
  );
}; 