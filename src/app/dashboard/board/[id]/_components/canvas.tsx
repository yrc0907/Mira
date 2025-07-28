'use client';

import React, { useState } from 'react';
import { useMyPresence, useOthers, useHistory, useCanUndo, useCanRedo } from '@/lib/liveblocks';
import { Participants } from './participants';
import Info from './info';
import Toolbar from './toolbar';
import { CanvasMode, CanvasState } from '@/types/canvas';

const Cursors = () => {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        if (presence.cursor === null) {
          return null;
        }
        return (
          <path
            key={connectionId}
            d={`M ${presence.cursor.x} ${presence.cursor.y} L ${presence.cursor.x + 10} ${presence.cursor.y + 10} M ${presence.cursor.x} ${presence.cursor.y + 10} L ${presence.cursor.x + 10} ${presence.cursor.y}`}
            stroke="black"
            strokeWidth="2"
          />
        );
      })}
    </>
  );
};

export function Canvas({ boardId }: { boardId: string }) {
  const [, updateMyPresence] = useMyPresence();
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None,
  });

  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const undo = history.undo;
  const redo = history.redo;

  return (
    <main
      className="h-full w-full relative bg-neutral-100 touch-none"
      onPointerMove={(e) => {
        const cursor = { x: Math.round(e.clientX), y: Math.round(e.clientY) };
        updateMyPresence({ cursor });
      }}
      onPointerLeave={() => {
        updateMyPresence({ cursor: null });
      }}
    >
      <Info />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        canRedo={canRedo}
        canUndo={canUndo}
        undo={undo}
        redo={redo}
      />
      <svg
        className="h-full w-full"
      >
        <g>
          <Cursors />
        </g>
      </svg>
    </main>
  );
}
