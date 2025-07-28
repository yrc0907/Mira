import React from "react";
import { Canvas } from "./_components/canvas";
import { Room } from "./room";
import Loading from "./loading";

interface BoardIdPageProps {
  params: {
    id: string;
  };
}

const BoardIdPage = async ({ params }: BoardIdPageProps) => {
  const { id } = await params;
  return (
    <Room roomId={id} fallback={<Loading />}>
      <Canvas boardId={id} />
    </Room>
  );
};

export default BoardIdPage;
