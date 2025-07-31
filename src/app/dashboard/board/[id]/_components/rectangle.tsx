import React from 'react';
import { LayerType, Color } from '@/types/canvas';
import { DraggableLayer } from './draggable-layer';
import { ResizableLayer } from './resizable-layer';

interface RectangleProps {
  id: string;
  layer: {
    type: LayerType.Rectangle;
    x: number;
    y: number;
    width: number;
    height: number;
    fill: Color;
    value?: string;
  };
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
}

export const Rectangle = ({
  id,
  layer,
  isSelected,
  onSelect
}: RectangleProps) => {
  const { x, y, width, height, fill } = layer;

  // 渲染基础矩形
  const renderRectangle = () => (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={`rgb(${fill.r}, ${fill.g}, ${fill.b})`}
      strokeWidth={isSelected ? 2 : 0}
      stroke={isSelected ? '#0000ff' : 'transparent'}
      style={{ cursor: isSelected ? 'grab' : 'pointer' }}
      onClick={(e) => !isSelected && onSelect(e as unknown as React.PointerEvent)}
    />
  );

  // 如果没有选中，只渲染基本矩形
  if (!isSelected) {
    return renderRectangle();
  }

  // 如果选中，添加拖拽和调整大小功能
  return (
    <DraggableLayer
      id={id}
      layer={layer}
      isSelected={isSelected}
    >
      <ResizableLayer
        id={id}
        layer={layer}
        isSelected={isSelected}
      >
        {renderRectangle()}
      </ResizableLayer>
    </DraggableLayer>
  );
}; 