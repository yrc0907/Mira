'use client';

import React, { useState } from 'react';
import { useMyPresence, useOthers, useHistory, useCanUndo, useCanRedo } from '@/lib/liveblocks';
import { Participants } from './participants';
import Info from './info';
import Toolbar from './toolbar';
import { CanvasMode, CanvasState } from '@/types/canvas';
import { Cursor } from './cursor';

const Cursors = () => {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId }) => (
        <Cursor
          key={connectionId}
          connectionId={connectionId}
        />
      ))}
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
        e.preventDefault();
        const { clientX, clientY } = e;
        const cursor = { x: Math.round(clientX), y: Math.round(clientY) };
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
        className="h-[100vh] w-[100vw]"
      >
        <g>
          <Cursors />
        </g>
      </svg>
    </main>
  );
}
