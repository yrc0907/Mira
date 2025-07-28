'use client';

import { CanvasMode, CanvasState } from '@/types/canvas';
import Info from './info';
import Participants from './participants';
import Toolbar from './toolbar';
import { useState } from 'react';
import { useCanRedo, useCanUndo, useHistory } from '@/liveblocks.config';

interface CanvasProps {
  boardId: string;
}

export const Canvas = ({ boardId }: CanvasProps) => {
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
    >
      <Info />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
    </main>
  );
};
