import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all books for the authenticated user
export async function GET() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const books = await prisma.book.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        latexContent: false
      }
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

// Create a new book
export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, latexContent } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const book = await prisma.book.create({
      data: {
        title,
        latexContent,
        userId: user.id,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error('Error creating book:', error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}

// Update an existing book
export async function PUT(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, title, latexContent } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify book ownership
    const existingBook = await prisma.book.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const book = await prisma.book.update({
      where: { id },
      data: { title, latexContent },
    });

    return NextResponse.json(book);
  } catch (error) {
    console.error('Error updating book:', error);
    return NextResponse.json(
      { error: "Failed to update book" },
      { status: 500 }
    );
  }
}

// Delete a book
export async function DELETE(request: Request) {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify book ownership
    const existingBook = await prisma.book.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existingBook) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    await prisma.book.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json(
      { error: "Failed to delete book" },
      { status: 500 }
    );
  }
}