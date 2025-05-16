import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { BooksList } from "@/components/BooksList";

const prisma = new PrismaClient();

export default async function DashboardPage() {
  const session = await getServerSession();
  
  if (!session?.user?.email) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect('/login');
  }
  const booksData = await prisma.book.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      createdAt: true,
    }
  });

  const books = booksData.map(book => ({
    ...book,
    createdAt: book.createdAt.toISOString()
  }));

  return (
    <div className="container mx-auto p-8">
      <BooksList books={books} />
    </div>
  );
}