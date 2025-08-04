"use client";
import {
  Circle,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  StickyNote,
  Type,
  Undo2,
  Grid,
  Palette,
  Trash2,
  Baseline,
  Dot,
  MoreHorizontal
} from "lucide-react";
import React, { useState, useRef, useCallback } from "react";
import ToolButton from "./tool-button";
import { CanvasMode, CanvasState, LayerType } from "@/types/canvas";
import { PencilStyle } from "./canvas";

interface ToolbarProps {
  canvasState: CanvasState;
  setCanvasState: (newState: CanvasState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  snapToGrid: boolean;          // 是否启用网格对齐
  toggleSnapToGrid: () => void; // 切换网格对齐的函数
  hasSelectedLayers: boolean;  // 是否有选中图层
  onDeleteLayers: () => void;  // 删除选中图层的函数
  onOpenColorPicker: () => void; // 打开颜色选择器的函数
  pencilThickness: number; // 铅笔粗细
  setPencilThickness: (thickness: number) => void; // 设置铅笔粗细的函数
  pencilStyle: PencilStyle; // 铅笔样式
  setPencilStyle: (style: PencilStyle) => void; // 设置铅笔样式的函数
}

const Toolbar = ({
  canvasState,
  setCanvasState,
  undo,
  redo,
  canUndo,
  canRedo,
  snapToGrid,
  toggleSnapToGrid,
  hasSelectedLayers,
  onDeleteLayers,
  onOpenColorPicker,
  pencilThickness,
  setPencilThickness,
  pencilStyle,
  setPencilStyle
}: ToolbarProps) => {
  // 添加状态来控制铅笔设置面板的显示
  const [showPencilOptions, setShowPencilOptions] = useState(false);
  const pencilOptionsRef = useRef<HTMLDivElement>(null);

  // 处理铅笔粗细改变
  const handleThicknessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPencilThickness(Number(e.target.value));
  };

  // 处理铅笔样式改变
  const handleStyleChange = (style: PencilStyle) => {
    setPencilStyle(style);
  };

  // 关闭铅笔选项面板的处理函数
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (pencilOptionsRef.current && !pencilOptionsRef.current.contains(e.target as Node)) {
      setShowPencilOptions(false);
    }
  }, []);

  // 添加和移除点击外部关闭面板的事件监听器
  React.useEffect(() => {
    if (showPencilOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPencilOptions, handleClickOutside]);

  return (
    <div className="absolute translate-y-1/2 left-2 flex flex-col gap-y-4">
      <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
        <ToolButton
          label="Select"
          icon={MousePointer2}
          onClick={() => setCanvasState({ mode: CanvasMode.None })}
          isActive={
            canvasState.mode === CanvasMode.None ||
            canvasState.mode === CanvasMode.Translating ||
            canvasState.mode === CanvasMode.SelectionNet ||
            canvasState.mode === CanvasMode.Pressing ||
            canvasState.mode === CanvasMode.Resizing
          }
        />
        <ToolButton
          label="Text"
          icon={Type}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Text,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Text
          }
        />
        <ToolButton
          label="Sticky Note"
          icon={StickyNote}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Note,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Note
          }
        />
        <ToolButton
          label="Square"
          icon={Square}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Rectangle,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Rectangle
          }
        />
        <ToolButton
          label="Circle"
          icon={Circle}
          onClick={() =>
            setCanvasState({
              mode: CanvasMode.Inserting,
              layerType: LayerType.Ellipse,
            })
          }
          isActive={
            canvasState.mode === CanvasMode.Inserting &&
            canvasState.layerType === LayerType.Ellipse
          }
        />
        <div className="relative">
          <ToolButton
            label="Pencil"
            icon={Pencil}
            onClick={() => {
              // Set canvas mode to Pencil and clear any selection
              setCanvasState({ mode: CanvasMode.Pencil });
              // Toggle pencil options panel
              setShowPencilOptions(!showPencilOptions);
            }}
            isActive={canvasState.mode === CanvasMode.Pencil}
          />

          {/* 铅笔设置面板 */}
          {showPencilOptions && (
            <div className="absolute left-12 top-0 bg-white rounded-md p-3 shadow-lg w-48 z-50" ref={pencilOptionsRef}>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-gray-700">铅笔设置</h3>

                {/* 粗细设置 */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">粗细: {pencilThickness}px</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={pencilThickness}
                    onChange={handleThicknessChange}
                    className="w-full"
                    aria-label="铅笔粗细调节"
                    title="铅笔粗细"
                  />
                </div>

                {/* 样式选择 */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-600">样式:</label>
                  <div className="flex justify-between gap-1">
                    <button
                      className={`flex-1 p-1 border rounded-md ${pencilStyle === PencilStyle.Solid ? 'bg-blue-100 border-blue-400' : 'border-gray-300'}`}
                      onClick={() => handleStyleChange(PencilStyle.Solid)}
                    >
                      <MoreHorizontal className="h-4 w-4 mx-auto" />
                      <span className="text-xs">实线</span>
                    </button>
                    <button
                      className={`flex-1 p-1 border rounded-md ${pencilStyle === PencilStyle.Dashed ? 'bg-blue-100 border-blue-400' : 'border-gray-300'}`}
                      onClick={() => handleStyleChange(PencilStyle.Dashed)}
                    >
                      <Baseline className="h-4 w-4 mx-auto" />
                      <span className="text-xs">虚线</span>
                    </button>
                    <button
                      className={`flex-1 p-1 border rounded-md ${pencilStyle === PencilStyle.Dotted ? 'bg-blue-100 border-blue-400' : 'border-gray-300'}`}
                      onClick={() => handleStyleChange(PencilStyle.Dotted)}
                    >
                      <Dot className="h-4 w-4 mx-auto" />
                      <span className="text-xs">点线</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
        <ToolButton
          label="Undo"
          icon={Undo2}
          onClick={undo}
          isDisabled={!canUndo}
        />
        <ToolButton
          label="Redo"
          icon={Redo2}
          onClick={redo}
          isDisabled={!canRedo}
        />
      </div>
      <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
        <ToolButton
          label={snapToGrid ? "Grid: On" : "Grid: Off"}
          icon={Grid}
          onClick={toggleSnapToGrid}
          isActive={snapToGrid}
        />
      </div>

      {/* 添加图层操作按钮（仅当有选中图层时显示） */}
      {hasSelectedLayers && (
        <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
          <ToolButton
            label="修改颜色"
            icon={Palette}
            onClick={onOpenColorPicker}
          />
          <ToolButton
            label="删除图层"
            icon={Trash2}
            onClick={onDeleteLayers}
            bgColor="bg-red-50"
            textColor="text-red-600"
          />
        </div>
      )}
    </div>
  );
};

Toolbar.Skeleton = function ToolbarSkeleton() {
  return (
    <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4 bg-white h-[360px] w-[52px] shadow-md rounded-md" />
  );
};

export default Toolbar;

