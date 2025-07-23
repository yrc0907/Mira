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
  // 这两个属性在父组件中已经设置了位置，所以这里不需要再处理x,y
  const menuRef = useRef<HTMLDivElement>(null);

  // 菜单外点击时关闭
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

  // 处理点击颜色事件
  const handleColorClick = (colorValue: string) => {
    console.log("Color clicked:", colorValue);
    // 应用颜色但不立即关闭菜单
    onColorSelect(colorValue);
    // 手动触发一个事件以保证颜色被应用
    setTimeout(() => {
      onClose();
    }, 50);
  };

  // 阻止事件冒泡的通用函数
  const stopEvent = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <div
      ref={menuRef}
      className="rounded-md bg-white shadow-lg p-2 min-w-[150px]"
      onClick={stopEvent}
      onContextMenu={stopEvent}
      onPointerDown={stopEvent}
    >
      <div className="text-sm font-medium mb-2 px-2 text-gray-700">更改颜色</div>
      <div className="grid grid-cols-3 gap-2 p-1">
        {DEFAULT_COLORS.map((color) => (
          <div
            key={color.value}
            className="w-6 h-6 rounded-full cursor-pointer border border-gray-300 hover:opacity-80 transition-opacity"
            style={{ backgroundColor: color.bgColor }}
            title={color.label}
            onClick={() => handleColorClick(color.value)}
            onMouseDown={stopEvent}
          />
        ))}
      </div>
    </div>
  );
}; 