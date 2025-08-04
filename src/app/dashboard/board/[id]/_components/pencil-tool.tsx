import React, { useMemo } from 'react';
import { Color, Point } from '@/types/canvas';
import { PencilStyle } from './canvas'; // Import the PencilStyle enum

// 声明类型以匹配Presence中的pencilDraft类型
export type PencilPoint = [x: number, y: number, pressure: number];

interface PencilToolProps {
  points: PencilPoint[] | null;
  penColor: string | null;
  penThickness?: number;
  penStyle?: string;
}

/**
 * 铅笔工具组件，负责渲染当前正在绘制的路径
 */
export const PencilTool = ({
  points,
  penColor,
  penThickness = 3, // 默认粗细为3
  penStyle = 'solid' // 默认为实线
}: PencilToolProps) => {
  // 如果没有点或者没有颜色，不渲染任何内容
  if (!points || points.length === 0 || !penColor) {
    return null;
  }

  // 创建路径数据
  const pathData = useMemo(() => {
    return createSmoothPath(points);
  }, [points]);

  // 根据笔画样式设置dash属性
  const getDashArray = (): string | undefined => {
    switch (penStyle) {
      case PencilStyle.Dashed:
        return `${penThickness * 3} ${penThickness * 2}`;
      case PencilStyle.Dotted:
        return `${penThickness} ${penThickness * 2}`;
      default:
        return undefined;
    }
  };

  return (
    <path
      d={pathData}
      stroke={penColor}
      strokeWidth={penThickness}
      strokeDasharray={getDashArray()}
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
      className="pencil-draft"
    />
  );
};

// 辅助函数：创建平滑的路径
function createSmoothPath(points: PencilPoint[]): string {
  if (points.length < 2) {
    return points.length === 1
      ? `M ${points[0][0]},${points[0][1]}`
      : "";
  }

  let path = `M ${points[0][0]},${points[0][1]}`;

  // 使用贝塞尔曲线创建平滑路径
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i][0] + points[i + 1][0]) / 2;
    const yc = (points[i][1] + points[i + 1][1]) / 2;
    path += ` Q ${points[i][0]},${points[i][1]} ${xc},${yc}`;
  }

  // 添加最后一个点
  const lastPoint = points[points.length - 1];
  path += ` L ${lastPoint[0]},${lastPoint[1]}`;

  return path;
}

// 公开助手函数
export const PencilHelpers = {
  createSmoothPath,

  // 开始绘制，返回初始点
  startDrawing: (point: Point, color: Color): {
    pencilDraft: PencilPoint[],
    penColor: string
  } => {
    return {
      pencilDraft: [[point.x, point.y, 1]] as PencilPoint[],
      penColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
    };
  },

  // 继续绘制，添加新点
  continueDrawing: (currentPoints: PencilPoint[], point: Point, pressure: number = 1): PencilPoint[] => {
    if (!currentPoints) return [[point.x, point.y, pressure]] as PencilPoint[];
    return [...currentPoints, [point.x, point.y, pressure] as PencilPoint];
  },

  // 计算路径边界
  getPathBounds: (points: PencilPoint[]) => {
    if (!points || points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    const minX = Math.min(...points.map(p => p[0]));
    const minY = Math.min(...points.map(p => p[1]));
    const maxX = Math.max(...points.map(p => p[0]));
    const maxY = Math.max(...points.map(p => p[1]));

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  },

  // 转换为相对坐标
  toRelativePoints: (points: PencilPoint[], originX: number, originY: number): PencilPoint[] => {
    return points.map(([x, y, pressure]) => [
      x - originX,
      y - originY,
      pressure
    ] as PencilPoint);
  },

  // 转换为绝对坐标
  toAbsolutePoints: (points: PencilPoint[], originX: number, originY: number): PencilPoint[] => {
    return points.map(([x, y, pressure]) => [
      x + originX,
      y + originY,
      pressure
    ] as PencilPoint);
  }
}; 