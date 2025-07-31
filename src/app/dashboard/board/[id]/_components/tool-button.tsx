"use client";

import { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import Hint from "@/components/hint";

interface ToolButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  bgColor?: string;
  textColor?: string;
}
const ToolButton = ({
  label,
  icon: Icon,
  onClick,
  isActive,
  isDisabled,
  bgColor,
  textColor,
}: ToolButtonProps) => {
  return (
    <Hint label={label} side="right" sideOffset={14}>
      <Button
        disabled={isDisabled}
        onClick={onClick}
        size="icon"
        variant={isActive ? "boardActive" : "board"}
        className={`${bgColor || ''} ${textColor || ''}`}
      >
        <Icon />
      </Button>
    </Hint>
  );
};

export default ToolButton; 