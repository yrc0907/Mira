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

  // 将颜色转换为CSS颜色字符串
  const fill = `rgb(${layer.fill.r}, ${layer.fill.g}, ${layer.fill.b})`;

  return (
    <path
      id={id}
      d={pathData}
      stroke={fill}
      strokeWidth="2"
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
      onPointerDown={(e) => {
        if (selectable && onLayerPointerDown) {
          onLayerPointerDown(e, id);
        }
      }}
      style={{
        cursor: selectable ? "pointer" : "default",
      }}
    />
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