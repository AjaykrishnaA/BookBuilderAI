'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SplitView from '@/components/SplitView';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLatexCompiler } from '@/hooks/use-latex-compiler';

interface BookData {
  id: string;
  title: string;
  latexContent: string;
}

export default function BookPage({ params }: { params: Promise<{ bookId: string }> }) {  const resolvedParams = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const { compileLatex } = useLatexCompiler();
  const [book, setBook] = useState<BookData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; chatMessage: string }[]>([]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    const fetchBook = async () => {
      try {        const response = await fetch(`/api/books/${resolvedParams.bookId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch book');
        }
        const data = await response.json();
        setBook(data);
        
        // Compile the LaTeX content to generate PDF
        if (data.latexContent) {
          const compilationResult = await compileLatex(data.latexContent);
          if (compilationResult.pdfUrl) {
            setPdfUrl(compilationResult.pdfUrl);
          } else {
            toast({
              title: 'Warning',
              description: 'Failed to compile PDF preview',
              variant: 'destructive',
            });
          }
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load book data',
          variant: 'destructive',
        });
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchBook();
    }
  }, [session, resolvedParams.bookId, router, status, toast]);

  if (status === 'loading' || loading) {
    return (
      <div className="h-screen p-4">
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (    <div className="h-screen">
      <SplitView
        initialLatexCode={book.latexContent}
        initialPdfUrl={pdfUrl}
        bookId={book.id}
        chatHistory={chatHistory}
        setChatHistory={setChatHistory}
      />
    </div>
  );
}
