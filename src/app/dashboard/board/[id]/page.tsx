"use client";

import React from "react";

// import { Room } from "@/components/room";
import { Canvas } from "@/components/board/canvas";

interface BoardIdPageProps {
  params: Promise<{
    id: string;
  }>;
};

const BoardIdPage = ({
  params,
}: BoardIdPageProps) => {
  const { id } = React.use(params);

  return (
    <Canvas boardId={id || ""} />
  );
};

export default BoardIdPage; 