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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tool } from "./canvas";

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
}

export function Toolbar({
  activeTool,
  setActiveTool,
  undo,
  redo,
  canUndo,
  canRedo,
}: ToolbarProps) {
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
      </div>
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