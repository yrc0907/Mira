import { useMemo } from "react";
import { Color } from "@/types/canvas";

interface ColorPickerProps {
  onChange: (color: Color) => void;
  value?: Color;
}

/**
 * 预定义的颜色选项
 */
const colorOptions: Color[] = [
  { r: 0, g: 0, b: 0 },           // 黑色
  { r: 255, g: 255, b: 255 },     // 白色
  { r: 255, g: 0, b: 0 },         // 红色
  { r: 0, g: 255, b: 0 },         // 绿色
  { r: 0, g: 0, b: 255 },         // 蓝色
  { r: 255, g: 255, b: 0 },       // 黄色
  { r: 255, g: 0, b: 255 },       // 紫色
  { r: 0, g: 255, b: 255 },       // 青色
  { r: 255, g: 165, b: 0 },       // 橙色
  { r: 139, g: 69, b: 19 },       // 棕色
  { r: 144, g: 238, b: 144 },     // 浅绿色
  { r: 173, g: 216, b: 230 },     // 浅蓝色
];

export const ColorPicker = ({
  onChange,
  value
}: ColorPickerProps) => {
  // 将Color对象转换为CSS颜色字符串
  const colorToString = (color: Color) => {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
  };

  // 检查两个颜色是否相同
  const isColorEqual = (color1: Color, color2: Color) => {
    return color1.r === color2.r && color1.g === color2.g && color1.b === color2.b;
  };

  // 计算当前选择的颜色
  const currentColor = useMemo(() => {
    return value ? colorToString(value) : colorToString(colorOptions[0]);
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {colorOptions.map((color, index) => {
          const isSelected = value && isColorEqual(color, value);
          const colorStyle = colorToString(color);

          return (
            <button
              key={index}
              className={`w-8 h-8 rounded-full flex items-center justify-center 
                ${isSelected ? 'ring-2 ring-black' : 'hover:ring-1 ring-neutral-400'}
                ${color.r === 255 && color.g === 255 && color.b === 255 ? 'border border-neutral-200' : ''}
              `}
              style={{ backgroundColor: colorStyle }}
              onClick={() => onChange(color)}
              aria-label={`选择颜色: ${colorStyle}`}
            >
              {isSelected && (
                <span className="text-xs text-white drop-shadow-md">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}; 