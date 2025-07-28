import { auth } from "@/auth";
import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = params;

  const board = await prisma.board.update({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      inviteCode: uuidv4(),
    },
  });

  return NextResponse.json({ code: board.inviteCode });
} 