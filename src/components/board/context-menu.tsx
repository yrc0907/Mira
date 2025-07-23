"use client";

import React, { useEffect, useRef, useState } from "react";

export interface ColorOption {
  label: string;
  value: string;
  bgColor: string;
}

const DEFAULT_COLORS: ColorOption[] = [
  { label: "White", value: "#FFFFFF", bgColor: "#FFFFFF" },
  { label: "Light Grey", value: "#D3D3D3", bgColor: "#D3D3D3" },
  { label: "Yellow", value: "#FFD700", bgColor: "#FFD700" },
  { label: "Orange", value: "#FFA500", bgColor: "#FFA500" },
  { label: "Red", value: "#FF6347", bgColor: "#FF6347" },
  { label: "Pink", value: "#FFC0CB", bgColor: "#FFC0CB" },
  { label: "Purple", value: "#BA55D3", bgColor: "#BA55D3" },
  { label: "Blue", value: "#1E90FF", bgColor: "#1E90FF" },
  { label: "Green", value: "#32CD32", bgColor: "#32CD32" },
];

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onColorSelect: (color: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onColorSelect,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [onClose]);

  // Calculate position to ensure menu stays within viewport
  const [position, setPosition] = useState({ x, y });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const newX = x + rect.width > window.innerWidth ? x - rect.width : x;
      const newY = y + rect.height > window.innerHeight ? y - rect.height : y;
      setPosition({ x: newX, y: newY });
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000,
      }}
      className="rounded-md bg-white shadow-lg p-2 min-w-[150px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="text-sm font-medium mb-2 px-2 text-gray-700">Change Color</div>
      <div className="grid grid-cols-3 gap-2">
        {DEFAULT_COLORS.map((color) => (
          <div
            key={color.value}
            className="w-6 h-6 rounded-full cursor-pointer border border-gray-300 hover:opacity-80"
            style={{ backgroundColor: color.bgColor }}
            title={color.label}
            onClick={() => {
              onColorSelect(color.value);
              onClose();
            }}
          />
        ))}
      </div>
    </div>
  );
}; 