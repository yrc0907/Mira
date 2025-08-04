import { Layer, LayerType } from "@/types/canvas";

interface PathLayerProps {
  id: string;
  layer: Layer;
  onLayerPointerDown?: (e: React.PointerEvent, layerId: string) => void;
  selectable?: boolean;
}

export const PathLayer = ({
  id,
  layer,
  onLayerPointerDown,
  selectable = true,
}: PathLayerProps) => {
  if (layer.type !== LayerType.Path) {
    return null;
  }

  // 确保points存在
  if (!layer.points || layer.points.length === 0) {
    return null;
  }

  // 创建SVG路径数据
  const pathData = createSvgPathFromPoints(layer.points);

  // 创建轮廓路径数据，用于更容易选择
  const outlinePath = createPathOutline(layer.points);

  // 将颜色转换为CSS颜色字符串
  const fill = `rgb(${layer.fill.r}, ${layer.fill.g}, ${layer.fill.b})`;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (selectable && onLayerPointerDown) {
      onLayerPointerDown(e, id);
    }
  };

  return (
    <g>
      {/* 隐藏的轮廓区域，用于更容易选择 */}
      {selectable && (
        <path
          d={outlinePath}
          fill="transparent"
          stroke="transparent"
          strokeWidth={1}
          onPointerDown={handlePointerDown}
          style={{
            cursor: "pointer"
          }}
        />
      )}

      {/* 可见的路径 */}
      <path
        id={id}
        d={pathData}
        stroke={fill}
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{
          cursor: selectable ? "pointer" : "default",
          pointerEvents: "none" // 确保不会干扰轮廓的点击事件
        }}
      />
    </g>
  );
};

// 辅助函数：从点数组创建SVG路径数据
function createSvgPathFromPoints(points: number[][]): string {
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