import { Room } from "./room";
import { Canvas } from "./_components/canvas";
import Loading from "./loading";

interface BoardIdPageProps {
  params: {
    id: string;
  };
};

const BoardIdPage = ({
  params,
}: BoardIdPageProps) => {
  return (
    <Room roomId={params.id} fallback={<Loading />}>
      <Canvas boardId={params.id} />
    </Room>
  );
};

export default BoardIdPage;
