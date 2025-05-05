'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Book {
  id: string;
  title: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBooks = async () => {
      const response = await fetch('/api/books');
      const data = await response.json();
      setBooks(data);
    };

    if (session?.user) {
      fetchBooks();
    }
  }, [session]);

  const handleCreateBook = () => {
    router.push('/');  // Redirect to book creation page
  };

  const handleEditBook = (bookId: string) => {
    router.push(`/book/${bookId}`);
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
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
    </div>
  );
}