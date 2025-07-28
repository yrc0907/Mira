import { auth } from "@/auth";
import { PrismaClient } from "@/generated/prisma";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

const prisma = new PrismaClient();

interface InvitePageProps {
  params: {
    inviteCode: string;
  };
}

const InvitePage = async ({ params }: InvitePageProps) => {
  const session = await auth();

  if (!session?.user?.id) {
    return redirect("/login");
  }

  const { inviteCode } = params;
  if (!inviteCode) {
    return notFound();
  }

  const board = await prisma.board.findUnique({
    where: {
      inviteCode,
    },
  });

  if (!board) {
    return notFound();
  }

  const member = await prisma.boardMember.findFirst({
    where: {
      boardId: board.id,
      userId: session.user.id,
    },
  });

  if (member || board.userId === session.user.id) {
    return redirect(`/dashboard/board/${board.id}`);
  }

  await prisma.boardMember.create({
    data: {
      boardId: board.id,
      userId: session.user.id,
    },
  });

  return redirect(`/dashboard/board/${board.id}`);
};

export default InvitePage; 