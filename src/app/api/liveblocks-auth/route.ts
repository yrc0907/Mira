import { auth } from "@/auth";
import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = session.user;
  const { room } = await request.json();

  const userInfo = {
    name: user.name!,
    email: user.email!,
    image: user.image!,
  };

  const { status, body } = await liveblocks.identifyUser(
    {
      userId: user.email!,
      groupIds: [],
    },
    {
      userInfo,
    }
  );

  return new Response(body, { status });
} 