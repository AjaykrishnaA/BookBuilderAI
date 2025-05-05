'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import ChatScreen from '@/components/ChatScreen';
import SplitView from '@/components/SplitView';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="flex flex-col h-screen">
      <nav className="bg-background border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Book Builder AI</h1>
        <div className="flex items-center gap-4">
          <span>{session.user?.email}</span>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm hover:underline"
          >
            Dashboard
          </button>
        </div>
      </nav>
      <main className="flex-1">
        <ChatScreen 
          onCreate={(latexCode) => {
            // Save the book first, then redirect to edit page
            fetch('/api/books', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: 'Untitled Book',
                latexContent: latexCode,
              }),
            })
              .then((res) => res.json())
              .then((book) => {
                router.push(`/dashboard`);
              });
          }}
        />
      </main>
    </div>
  );
}

