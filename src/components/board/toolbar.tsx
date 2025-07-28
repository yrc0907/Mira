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
  MinusSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tool, Layer } from "./canvas";
import { useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";

interface ToolButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
}

const ToolButton = ({
  label,
  icon,
  onClick,
  isActive,
  isDisabled,
}: ToolButtonProps) => (
  <Button
    variant={isActive ? "secondary" : "ghost"}
    size="icon"
    onClick={onClick}
    disabled={isDisabled}
    aria-label={label}
  >
    {icon}
  </Button>
);

interface ToolbarProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  strokeWidth?: number;
  setStrokeWidth?: (width: number) => void;
  strokeStyle?: "solid" | "dashed" | "dotted";
  setStrokeStyle?: (style: "solid" | "dashed" | "dotted") => void;
  updateSelectedLayersProperties?: (properties: Partial<Layer>) => void;
  strokeColor?: string;
  onColorChange?: (color: string) => void;
}

export function Toolbar({
  activeTool,
  setActiveTool,
  undo,
  redo,
  canUndo,
  canRedo,
  strokeWidth = 2,
  setStrokeWidth = () => { },
  strokeStyle = "solid",
  setStrokeStyle = () => { },
  updateSelectedLayersProperties = () => { },
  strokeColor = "black",
  onColorChange = () => { },
}: ToolbarProps) {
  // 当前选中的工具是否为绘图工具
  const isDrawingTool = activeTool === Tool.Pencil || activeTool === Tool.Line || activeTool === Tool.Rectangle || activeTool === Tool.Circle;

  // 当工具变更时，显示或隐藏属性面板
  const [showProperties, setShowProperties] = useState(false);

  useEffect(() => {
    setShowProperties(isDrawingTool);
  }, [activeTool, isDrawingTool]);

  // 处理线条样式变更
  const handleStyleChange = (style: "solid" | "dashed" | "dotted") => {
    setStrokeStyle(style);
    updateSelectedLayersProperties({ strokeStyle: style });
  };

  // 处理线条粗细变更
  const handleWidthChange = (width: number) => {
    setStrokeWidth(width);
    updateSelectedLayersProperties({ strokeWidth: width });
  };

  // 处理颜色变更
  const handleColorChange = (color: string) => {
    onColorChange(color);
  };

  return (
    <div
      className="absolute mt-100 right-5 flex -translate-y-1/2 flex-col items-center gap-y-4"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col items-center gap-y-1 rounded-md bg-white p-1.5 shadow-md">
        <ToolButton
          label="Select"
          icon={<MousePointer2 className="h-5 w-5" />}
          onClick={() => setActiveTool(Tool.Selection)}
          isActive={activeTool === Tool.Selection}
        />
        <ToolButton
          label="Text"
          icon={<Type className="h-5 w-5" />}
          onClick={() => setActiveTool(Tool.Text)}
          isActive={activeTool === Tool.Text}
        />
        <ToolButton
          label="Sticky Note"
          icon={<StickyNote className="h-5 w-5" />}
          onClick={() => setActiveTool(Tool.StickyNote)}
          isActive={activeTool === Tool.StickyNote}
        />
        <ToolButton
          label="Rectangle"
          icon={<Square className="h-5 w-5" />}
          onClick={() => setActiveTool(Tool.Rectangle)}
          isActive={activeTool === Tool.Rectangle}
        />
        <ToolButton
          label="Circle"
          icon={<Circle className="h-5 w-5" />}
          onClick={() => setActiveTool(Tool.Circle)}
          isActive={activeTool === Tool.Circle}
        />
        <ToolButton
          label="Pencil"
          icon={<Pencil className="h-5 w-5" />}
          onClick={() => setActiveTool(Tool.Pencil)}
          isActive={activeTool === Tool.Pencil}
        />
        <ToolButton
          label="Line"
          icon={<MinusSquare className="h-5 w-5" />}
          onClick={() => setActiveTool(Tool.Line)}
          isActive={activeTool === Tool.Line}
        />
      </div>

      {/* 线条属性面板 */}
      {showProperties && (
        <div className="flex flex-col items-center gap-y-2 rounded-md bg-white p-3 shadow-md">
          <div className="text-xs font-medium">颜色</div>
          <div className="flex gap-2">
            <Button
              className="h-8 w-8 rounded-full border"
              style={{ backgroundColor: "#000000" }}
              onClick={() => handleColorChange("#000000")}
            />
            <Button
              className="h-8 w-8 rounded-full border"
              style={{ backgroundColor: "#FF0000" }}
              onClick={() => handleColorChange("#FF0000")}
            />
            <Button
              className="h-8 w-8 rounded-full border"
              style={{ backgroundColor: "#0000FF" }}
              onClick={() => handleColorChange("#0000FF")}
            />
          </div>
          <div className="text-xs font-medium">线条粗细</div>
          <div className="w-full px-2">
            <Slider
              value={[strokeWidth]}
              min={1}
              max={10}
              step={1}
              onValueChange={(value: number[]) => handleWidthChange(value[0])}
            />
          </div>
          <div className="text-xs font-medium mt-2">线条样式</div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={strokeStyle === "solid" ? "secondary" : "outline"}
              className="text-xs h-8"
              onClick={() => handleStyleChange("solid")}
            >
              实线
            </Button>
            <Button
              size="sm"
              variant={strokeStyle === "dashed" ? "secondary" : "outline"}
              className="text-xs h-8"
              onClick={() => handleStyleChange("dashed")}
            >
              虚线
            </Button>
            <Button
              size="sm"
              variant={strokeStyle === "dotted" ? "secondary" : "outline"}
              className="text-xs h-8"
              onClick={() => handleStyleChange("dotted")}
            >
              点线
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-y-1 rounded-md bg-white p-1.5 shadow-md">
        <ToolButton
          label="Undo"
          icon={<Undo2 className="h-5 w-5" />}
          onClick={undo}
          isDisabled={!canUndo}
        />
        <ToolButton
          label="Redo"
          icon={<Redo2 className="h-5 w-5" />}
          onClick={redo}
          isDisabled={!canRedo}
        />
      </div>
    </div>
  );
} 