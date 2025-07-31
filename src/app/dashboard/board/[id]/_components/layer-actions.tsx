import { useMutation } from "@/liveblocks.config";
import { Color } from "@/types/canvas";
import { Trash2, Palette, X, ArrowUpToLine, ArrowDownToLine, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { ColorPicker } from "./color-picker";

interface LayerActionsProps {
  layerIds: string[];
  onClose?: () => void;
}

export const LayerActions = ({
  layerIds,
  onClose
}: LayerActionsProps) => {
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const actionRef = useRef<HTMLDivElement>(null);

  // 删除选中的图层
  const deleteLayers = useMutation(({ storage }) => {
    const layers = storage.get("layers");
    const layerIdsList = storage.get("layerIds");

    // 从layerIds中移除所选图层
    layerIds.forEach(id => {
      const index = layerIdsList.indexOf(id);
      if (index !== -1) {
        layerIdsList.delete(index);
      }
      // 从layers中移除图层
      layers.delete(id);
    });
  }, [layerIds]);

  // 更改选中图层的颜色
  const updateLayersColor = useMutation(({ storage }, color: Color) => {
    const layers = storage.get("layers");

    layerIds.forEach(id => {
      const layer = layers.get(id);
      if (layer) {
        layer.update({
          fill: color
        });
      }
    });
  }, [layerIds]);

  // 将图层移到最前面
  const bringToFront = useMutation(({ storage }) => {
    const layerIdsList = storage.get("layerIds");
    const idsArray = layerIdsList.toArray();
    const totalLayers = idsArray.length;

    // 按当前层级顺序排序选中的图层（从前往后）
    const selectedIndices = layerIds
      .map(id => idsArray.indexOf(id))
      .filter(index => index !== -1)
      .sort((a, b) => b - a); // 从后往前排序，以确保移动顺序正确

    // 从前往后移动每个图层到最顶部
    for (let i = 0; i < selectedIndices.length; i++) {
      const id = idsArray[selectedIndices[i]];
      const currentIndex = layerIdsList.indexOf(id);
      const targetIndex = totalLayers - 1 - i;

      if (currentIndex !== targetIndex) {
        layerIdsList.move(currentIndex, targetIndex);
      }
    }
  }, [layerIds]);

  // 将图层移到最后面
  const sendToBack = useMutation(({ storage }) => {
    const layerIdsList = storage.get("layerIds");
    const idsArray = layerIdsList.toArray();

    // 按当前层级顺序排序选中的图层（从后往前）
    const selectedIndices = layerIds
      .map(id => idsArray.indexOf(id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b);

    // 从前往后（即从底层开始）移动每个图层到最底部
    for (let i = 0; i < selectedIndices.length; i++) {
      // 考虑到每次移动后索引会变化，需要重新计算当前位置
      const currentIndex = layerIdsList.indexOf(layerIds[i]);
      if (currentIndex > i) { // 确保图层还没有到达目标位置
        layerIdsList.move(currentIndex, i);
      }
    }
  }, [layerIds]);

  // 向前移动一层
  const bringForward = useMutation(({ storage }) => {
    const layerIdsList = storage.get("layerIds");
    const idsArray = layerIdsList.toArray();

    // 按当前层级顺序排序选中的图层（从前往后）
    const selectedIndices = layerIds
      .map(id => idsArray.indexOf(id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b);

    // 从后往前（即从顶层开始）移动每个图层向前一步
    for (let i = selectedIndices.length - 1; i >= 0; i--) {
      const currentIndex = selectedIndices[i];
      const nextIndex = currentIndex + 1;

      // 如果不是最顶层，则向前移动一步
      if (nextIndex < idsArray.length) {
        layerIdsList.move(currentIndex, nextIndex);
      }
    }
  }, [layerIds]);

  // 向后移动一层
  const sendBackward = useMutation(({ storage }) => {
    const layerIdsList = storage.get("layerIds");
    const idsArray = layerIdsList.toArray();

    // 按当前层级顺序排序选中的图层（从后往前）
    const selectedIndices = layerIds
      .map(id => idsArray.indexOf(id))
      .filter(index => index !== -1)
      .sort((a, b) => a - b);

    // 从前往后（即从底层开始）移动每个图层向后一步
    for (let i = 0; i < selectedIndices.length; i++) {
      const currentIndex = selectedIndices[i];
      const prevIndex = currentIndex - 1;

      // 如果不是最底层，则向后移动一步
      if (prevIndex >= 0) {
        layerIdsList.move(currentIndex, prevIndex);
      }
    }
  }, [layerIds]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // 如果颜色选择器打开，不要关闭图层菜单
      if (isColorPickerOpen) return;

      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    };

    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [onClose, isColorPickerOpen]);

  const handleColorSelect = useCallback((color: Color) => {
    updateLayersColor(color);
    setIsColorPickerOpen(false);
    // 不要关闭整个图层选项菜单
  }, [updateLayersColor]);

  return (
    <div
      ref={actionRef}
      className="absolute bg-white rounded-md shadow-md p-3 min-w-[220px] z-50 border border-gray-200"
      style={{ top: "40px", right: "0px" }}
    >
      <div className="flex flex-col gap-2">
        <div className="absolute right-2 top-2">
          <X
            className="w-4 h-4 text-gray-500 cursor-pointer hover:text-gray-800"
            onClick={() => {
              setIsColorPickerOpen(false);
              onClose?.();
            }}
          />
        </div>
        <p className="text-sm font-medium mb-2">
          已选择 {layerIds.length} 个图层
        </p>
        <div className="border-t border-gray-200 my-2"></div>
        <button
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md transition-colors text-sm w-full"
          onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
        >
          <Palette className="w-4 h-4" />
          <span>更改颜色</span>
        </button>
        <div className="border-t border-gray-200 my-2"></div>
        <p className="text-sm font-medium mb-1">图层深度</p>
        <button
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md transition-colors text-sm w-full"
          onClick={() => bringToFront()}
        >
          <ArrowUpToLine className="w-4 h-4" />
          <span>移到最前</span>
        </button>
        <button
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md transition-colors text-sm w-full"
          onClick={() => sendToBack()}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>移到最后</span>
        </button>
        <button
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md transition-colors text-sm w-full"
          onClick={() => bringForward()}
        >
          <ArrowUp className="w-4 h-4" />
          <span>上移一层</span>
        </button>
        <button
          className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md transition-colors text-sm w-full"
          onClick={() => sendBackward()}
        >
          <ArrowDown className="w-4 h-4" />
          <span>下移一层</span>
        </button>
        <div className="border-t border-gray-200 my-2"></div>
        <button
          className="flex items-center gap-2 p-2 hover:bg-rose-100 rounded-md transition-colors text-sm w-full text-rose-500"
          onClick={() => deleteLayers()}
        >
          <Trash2 className="w-4 h-4" />
          <span>删除图层</span>
        </button>
      </div>
      {isColorPickerOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-md shadow-md z-50">
          <ColorPicker onChange={handleColorSelect} />
        </div>
      )}
    </div>
  );
}; 