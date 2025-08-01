"use client";

import { memo } from "react";
import { MousePointer2 } from "lucide-react";

import { connectionIdToColor } from "@/lib/utils";
import { useOthers } from "@/lib/liveblocks";

interface CursorProps {
  connectionId: number;
};

export const Cursor = memo(({
  connectionId,
}: CursorProps) => {
  const others = useOthers();
  const user = others.find((user) => user.connectionId === connectionId);

  const info = user?.info;
  const cursor = user?.presence.cursor;

  const name = info?.name || "Teammate";

  if (!cursor) {
    return null;
  }

  const { x, y } = cursor;

  return (
    <foreignObject
      style={{
        transform: `translateX(${x}px) translateY(${y}px)`
      }}
      height={50}
      width={name.length * 10 + 24}
      className="relative drop-shadow-md"
    >
      <MousePointer2
        className="h-5 w-5"
        style={{
          fill: connectionIdToColor(connectionId),
          color: connectionIdToColor(connectionId),
        }}
      />
      <div
        className="absolute left-5 px-1.5 py-0.5 rounded-md text-xs text-white font-semibold"
        style={{
          backgroundColor: connectionIdToColor(connectionId),
        }}
      >
        {name}
      </div>
    </foreignObject>
  )
});

Cursor.displayName = "Cursor"; 