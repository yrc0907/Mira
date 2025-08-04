import React, { useState, useCallback } from 'react';
import { Layer, LayerType } from '@/types/canvas';
import { ResizableLayer } from './resizable-layer';
import { TranslateLayer } from './translate-layer';
import { PathRenderer } from './path-renderer';

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

// 创建路径轮廓，用于更容易选择
function createPathOutline(points: number[][]): string {
  if (!points || points.length === 0) return "";

  // 计算路径边界
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  points.forEach(point => {
    minX = Math.min(minX, point[0]);
    minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]);
    maxY = Math.max(maxY, point[1]);
  });

  // 添加一些padding以便更容易选择
  const padding = 5;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  // 创建矩形路径
  return `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z`;
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

  // 处理选择事件，确保事件冒泡被阻止
  const handleSelect = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();

    // 如果已选中，不重复触发选择事件
    if (isSelected) return;

    // 调用传入的选择回调
    onSelect(e);
  }, [onSelect, isSelected]);

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
            onPointerDown={(e) => !isSelected && handleSelect(e)}
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
            onPointerDown={(e) => !isSelected && handleSelect(e)}
          />
        );

      case LayerType.Path:
        // 使用专门的PathRenderer组件处理Path类型图层
        return (
          <PathRenderer
            id={id}
            layer={layer}
            isSelected={isSelected}
            onSelect={handleSelect}
          />
        );

      case LayerType.Text:
      case LayerType.Note:
        return (
          <foreignObject
            x={layer.x}
            y={layer.y}
            width={layer.width}
            height={layer.height}
            onPointerDown={(e) => !isSelected && handleSelect(e)}
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