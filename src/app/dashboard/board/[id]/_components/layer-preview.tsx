import { Layer, LayerType } from "@/types/canvas";
import { Rectangle } from "./rectangle";
import { EditableLayer } from "./editable-layer";
import { LiveObject } from "@liveblocks/client";

interface LayerPreviewProps {
  // 使用联合类型，支持LiveObject<Layer>和直接的Layer
  layer: LiveObject<Layer> | Layer;
  layerId: string;
  isSelected: boolean;
  onLayerSelect: (layerId: string, e: React.PointerEvent) => void;
  snapToGrid?: boolean;  // 添加网格对齐选项
  gridSize?: number;     // 添加网格大小选项
}

export const LayerPreview = ({
  layer,
  layerId,
  isSelected,
  onLayerSelect,
  snapToGrid = false,
  gridSize = 20
}: LayerPreviewProps) => {
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    onLayerSelect(layerId, e);
  };

  // 获取实际的Layer数据，检查是否有toObject方法
  const layerData: Layer = 'toObject' in layer && typeof layer.toObject === 'function'
    ? layer.toObject()
    : layer as Layer;

  // 使用新的EditableLayer组件渲染图层
  return (
    <EditableLayer
      id={layerId}
      layer={layerData}
      isSelected={isSelected}
      onSelect={handlePointerDown}
      snapToGrid={snapToGrid}
      gridSize={gridSize}
    />
  );
}; 