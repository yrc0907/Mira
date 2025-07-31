import React, { useState, useCallback } from 'react';
import { Layer, LayerType } from '@/types/canvas';
import { ResizableLayer } from './resizable-layer';
import { TranslateLayer } from './translate-layer';

// 创建平滑路径的辅助函数
function createSmoothPath(points: number[][]): string {
  if (points.length < 2) {
    return points.length === 1
      ? `M ${points[0][0]},${points[0][1]}`
      : "";
  }

  let path = `M ${points[0][0]},${points[0][1]}`;

  // 使用贝塞尔曲线创建平滑路径
  // 对于每三个点，创建一个二次贝塞尔曲线
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i][0] + points[i + 1][0]) / 2;
    const yc = (points[i][1] + points[i + 1][1]) / 2;

    // 笔触压力可以用于调整曲线的控制点
    // 但在SVG路径中我们只能使用坐标，所以这里暂时不使用pressure
    path += ` Q ${points[i][0]},${points[i][1]} ${xc},${yc}`;
  }

  // 添加最后一个点
  const lastPoint = points[points.length - 1];
  path += ` L ${lastPoint[0]},${lastPoint[1]}`;

  return path;
}

interface EditableLayerProps {
  id: string;
  layer: Layer;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
  snapToGrid?: boolean;
  gridSize?: number;
}

/**
 * 可编辑图层组件，支持拖动和调整大小
 */
export const EditableLayer = ({
  id,
  layer,
  isSelected,
  onSelect,
  snapToGrid = false,
  gridSize = 10
}: EditableLayerProps) => {
  const [isEditing, setIsEditing] = useState(false);

  // 处理编辑操作开始
  const handleOperationStart = useCallback(() => {
    setIsEditing(true);
  }, []);

  // 处理编辑操作结束
  const handleOperationEnd = useCallback(() => {
    setIsEditing(false);
  }, []);

  // 渲染特定类型的图层内容
  const renderLayerContent = () => {
    switch (layer.type) {
      case LayerType.Rectangle:
        return (
          <rect
            x={layer.x}
            y={layer.y}
            width={layer.width}
            height={layer.height}
            fill={`rgb(${layer.fill.r}, ${layer.fill.g}, ${layer.fill.b})`}
            onClick={(e) => !isSelected && onSelect(e as unknown as React.PointerEvent)}
          />
        );

      case LayerType.Ellipse:
        return (
          <ellipse
            cx={layer.x + layer.width / 2}
            cy={layer.y + layer.height / 2}
            rx={layer.width / 2}
            ry={layer.height / 2}
            fill={`rgb(${layer.fill.r}, ${layer.fill.g}, ${layer.fill.b})`}
            onClick={(e) => !isSelected && onSelect(e as unknown as React.PointerEvent)}
          />
        );

      case LayerType.Path:
        if (!layer.points || layer.points.length === 0) return null;

        // 创建平滑的SVG路径数据
        // 对于Path类型，我们直接使用points中的坐标，不再考虑x和y偏移
        const pathData = createSmoothPath(layer.points);

        // 获取路径的颜色
        const strokeColor = `rgb(${layer.fill.r}, ${layer.fill.g}, ${layer.fill.b})`;

        return (
          <g>
            {/* 可见的路径 */}
            <path
              d={pathData}
              stroke={strokeColor}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* 透明的选择区域（更宽以便于选择） */}
            <path
              d={pathData}
              stroke="transparent"
              strokeWidth={10}
              fill="none"
              style={{ cursor: 'pointer' }}
              onClick={(e) => !isSelected && onSelect(e as unknown as React.PointerEvent)}
            />
          </g>
        );

      case LayerType.Text:
      case LayerType.Note:
        return (
          <foreignObject
            x={layer.x}
            y={layer.y}
            width={layer.width}
            height={layer.height}
            onClick={(e) => !isSelected && onSelect(e as unknown as React.PointerEvent)}
          >
            <div
              className={`h-full w-full flex items-center justify-center text-sm p-2 ${layer.type === LayerType.Note ? "bg-yellow-200" : ""
                }`}
            >
              {layer.value || "Empty text"}
            </div>
          </foreignObject>
        );

      default:
        return null;
    }
  };

  // 没有选中时直接返回内容
  if (!isSelected) {
    return renderLayerContent();
  }

  // 选中时添加平移和调整大小功能
  return (
    <TranslateLayer
      id={id}
      layer={layer}
      isSelected={isSelected}
      snapToGrid={snapToGrid}
      gridSize={gridSize}
      onTranslateStart={handleOperationStart}
      onTranslateEnd={handleOperationEnd}
    >
      <ResizableLayer
        id={id}
        layer={layer}
        isSelected={isSelected}
        onResizeStart={handleOperationStart}
        onResizeEnd={handleOperationEnd}
      >
        {renderLayerContent()}
      </ResizableLayer>
    </TranslateLayer>
  );
}; 