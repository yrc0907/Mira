import { auth } from "@/auth";
import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";

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
  const { email } = await req.json();

  const board = await prisma.board.findUnique({
    where: {
      id: id,
      userId: session.user.id,
    },
  });

  if (!board) {
    return new NextResponse("Board not found or you're not the owner", {
      status: 404,
    });
  }

  const userToInvite = await prisma.user.findUnique({
    where: {
      username: email,
    },
  });

  if (!userToInvite) {
    return new NextResponse("User not found", { status: 404 });
  }

  const existingMember = await prisma.boardMember.findFirst({
    where: {
      boardId: id,
      userId: userToInvite.id,
    },
  });

  if (existingMember) {
    return new NextResponse("User is already a member of this board", {
      status: 400,
    });
  }

  await prisma.boardMember.create({
    data: {
      boardId: id,
      userId: userToInvite.id,
    },
  });

  return new NextResponse("User added to board", { status: 200 });
} 