'use client';

import {useState} from 'react';
import ChatScreen from '@/components/ChatScreen';
import SplitView from '@/components/SplitView';
import { useLatexCompiler } from '@/hooks/use-latex-compiler';

export default function Home() {
  const [latexCode, setLatexCode] = useState<string>('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showSplitView, setShowSplitView] = useState<boolean>(false);
  const [bookId, setBookId] = useState<string | undefined>();
  const [chatHistory, setChatHistory] = useState<
    {role: 'user' | 'assistant'; chatMessage: string}[]
  >([]);
  const { compileLatex } = useLatexCompiler();

  const handleCreate = async (initialLatexCode: string, compiledPdfUrl: string, bookId?: string) => {
    setLatexCode(initialLatexCode);
    setPdfUrl(compiledPdfUrl);
    setBookId(bookId);
    setShowSplitView(true);
  };

  return (
    <div className="flex flex-col h-screen">
      {!showSplitView ? (
        <ChatScreen 
          onCreate={handleCreate} 
          latexCode={latexCode}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
          mode="seed"
          compact={true}
        />
      ) : (
        <SplitView 
          initialLatexCode={latexCode}
          initialPdfUrl={pdfUrl}
          bookId={bookId}
          chatHistory={chatHistory}
          setChatHistory={setChatHistory}
        />
      )}
    </div>
  );
}

