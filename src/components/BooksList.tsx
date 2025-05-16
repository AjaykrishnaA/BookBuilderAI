'use client';

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Book {
  id: string;
  title: string;
  createdAt: string;
}

interface BooksListProps {
  books: Book[];
}

export function BooksList({ books }: BooksListProps) {
  const router = useRouter();

  const handleCreateBook = () => {
    router.push('/');
  };

  const handleEditBook = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Books</h1>
        <Button onClick={handleCreateBook}>Create New Book</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <Card key={book.id} className="p-6">
            <h2 className="text-xl font-semibold mb-2">{book.title}</h2>
            <p className="text-gray-500 mb-4">
              Created: {new Date(book.createdAt).toLocaleDateString()}
            </p>
            <Button
              variant="outline"
              onClick={() => handleEditBook(book.id)}
              className="w-full"
            >
              Edit Book
            </Button>
          </Card>
        ))}
      </div>

      {books.length === 0 && (
        <div className="text-center text-gray-500 mt-8">
          No books created yet. Click &quot;Create New Book&quot; to get started.
        </div>
      )}
    </>
  );
}
