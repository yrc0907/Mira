import { auth } from "@/auth";
import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  try {
    const boards = await prisma.board.findMany({
      where: {
        OR: [
          {
            userId,
          },
          {
            members: {
              some: {
                userId,
              },
            },
          },
        ],
      },
    });

    return NextResponse.json({ boards });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST /api/boards - Create a new board
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, coverImage, description = "" } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const newBoard = await prisma.board.create({
      data: {
        title,
        coverImage: coverImage || "",
        description,
        userId: session.user.id,
      },
    });

    return NextResponse.json(newBoard);
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
  }
} 