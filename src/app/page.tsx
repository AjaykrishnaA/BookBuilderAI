'use client';

import {useState} from 'react';
import ChatScreen from '@/components/ChatScreen';
import SplitView from '@/components/SplitView';

export default function Home() {
  const [latexCode, setLatexCode] = useState<string>('');
  const [showSplitView, setShowSplitView] = useState<boolean>(false);

  const handleCreate = (initialLatexCode: string) => {
    setLatexCode(initialLatexCode);
    setShowSplitView(true);
  };

  return (
    <div className="flex flex-col h-screen">
      {!showSplitView ? (
        <ChatScreen onCreate={handleCreate} />
      ) : (
        <SplitView initialLatexCode={latexCode} />
      )}
    </div>
  );
}

