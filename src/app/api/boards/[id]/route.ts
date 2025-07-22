import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/database";

// GET /api/boards/[id] - Get a specific board
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boardId = params.id;

  try {
    const board = await prisma.board.findUnique({
      where: {
        id: boardId,
      },
      include: {
        tasks: {
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check if the user owns this board
    if (board.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json({ error: "Failed to fetch board" }, { status: 500 });
  }
}

// PATCH /api/boards/[id] - Update a board
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boardId = params.id;

  try {
    // First check if the board exists and belongs to the user
    const existingBoard = await prisma.board.findUnique({
      where: {
        id: boardId,
      },
    });

    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (existingBoard.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Now update the board
    const { title, description, coverImage } = await request.json();

    const updatedBoard = await prisma.board.update({
      where: {
        id: boardId,
      },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(coverImage && { coverImage }),
      },
    });

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("Error updating board:", error);
    return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
  }
}

// DELETE /api/boards/[id] - Delete a board
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const boardId = params.id;

  try {
    // First check if the board exists and belongs to the user
    const existingBoard = await prisma.board.findUnique({
      where: {
        id: boardId,
      },
    });

    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (existingBoard.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the board
    await prisma.board.delete({
      where: {
        id: boardId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting board:", error);
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
  }
} 