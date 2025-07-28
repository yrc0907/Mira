import { Liveblocks } from "@liveblocks/node";
import { auth } from "@/auth";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { room } = await request.json();
  const board = await prisma.board.findUnique({
    where: {
      id: room,
    },
  });

  if (board?.userId !== user.id) {
    const boardMember = await prisma.boardMember.findFirst({
      where: {
        boardId: room,
        userId: user.id,
      },
    });
    if (!boardMember) {
      return new Response("Unauthorized", { status: 403 });
    }
  }

  const userInfo = {
    name: user.name!,
    picture: "https://liveblocks.io/avatars/avatar-4.png", // Replace with actual user avatar url
  };

  const liveblocksSession = liveblocks.prepareSession(user.id, {
    userInfo,
  });

  liveblocksSession.allow(room, liveblocksSession.FULL_ACCESS);

  const { status, body } = await liveblocksSession.authorize();
  return new Response(body, { status });
} 