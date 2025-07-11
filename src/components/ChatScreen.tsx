'use client';

import {useState, useRef, useEffect} from 'react';
import {generateLatexBook} from '@/ai/flows/generate-latex-book';
import {refineLatexContent} from '@/ai/flows/refine-latex-content';
import { useLatexCompiler } from '@/hooks/use-latex-compiler';
import { useToast } from '@/hooks/use-toast';
import ChatInput from './ChatInput';

interface ChatScreenProps {
  onCreate: (latexCode: string, pdfUrl: string, bookId?: string) => void;
  latexCode?: string;
  chatHistory: {role: 'user' | 'assistant'; chatMessage: string}[];
  setChatHistory: React.Dispatch<React.SetStateAction<{role: 'user' | 'assistant'; chatMessage: string}[]>>;
  mode?: 'seed' | 'chat';
  compact?: boolean;
}

const ChatScreen: React.FC<ChatScreenProps> = ({onCreate, latexCode = '', chatHistory, setChatHistory, mode = 'chat', compact = false}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { compileLatex, isCompiling } = useLatexCompiler();
  const { toast } = useToast();

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const extractTitleFromPrompt = (prompt: string): string => {
    // Try to find a title-like phrase at the start of the prompt
    const titleMatch = prompt.match(/^(?:create |write |generate )?(?:a |an )?(?:book |)(?:about |on |for |titled |called |named )?["']?([^"'.!?]+)["']?[.!?]?/i);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
    // Fallback: take first few words
    return prompt.split(' ').slice(0, 4).join(' ');
  };

  const handleSend = async (prompt: string) => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    const newMessage = {role: 'user' as const, chatMessage: prompt};
    const updatedHistory = [...chatHistory, newMessage];
    setChatHistory(updatedHistory);

    if (chatHistory.length === 0) {
      // Initial book generation
      try {
        const result = await generateLatexBook({prompt: prompt});
        setChatHistory(prevChatHistory => [
          ...prevChatHistory,
          {role: 'assistant', chatMessage: result.chatMessage},
        ]);
        
        // Compile the initial LaTeX code
        const compileResult = await compileLatex(result.latexCode);
        if (compileResult.pdfUrl) {
          // Create new book in database
          try {
            const response = await fetch('/api/books', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: extractTitleFromPrompt(prompt),
                latexContent: result.latexCode,
              }),
            });
            
            if (!response.ok) {
              toast({
                title: "Error",
                description: "Failed to create book in database",
                variant: "destructive",
              });
              onCreate(result.latexCode, compileResult.pdfUrl);
            } else {
              const book = await response.json();
              onCreate(result.latexCode, compileResult.pdfUrl, book.id);
            }
          } catch (error: any) {
            console.error('Error creating book:', error);
            toast({
              title: "Error",
              description: "Failed to connect to database",
              variant: "destructive",
            });
            // Still call onCreate even if database creation fails
            onCreate(result.latexCode, compileResult.pdfUrl);
          }
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to generate book",
          variant: "destructive",
        });
        setChatHistory(prevChatHistory => [
          ...prevChatHistory,
          {
            role: 'assistant',
            chatMessage: `Error: ${error.message}`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    } else {
      // Refine existing LaTeX code
      try {
        if (!latexCode) {
          throw new Error('No previous LaTeX code found.');
        }
        const result = await refineLatexContent({
          latexContent: latexCode,
          chatHistory: [...chatHistory, {role: 'user', chatMessage: prompt}],
          prompt: prompt,
        });
        
        // Compile the refined LaTeX code
        const compileResult = await compileLatex(result.refinedLatexContent);
        if (compileResult.pdfUrl) {
          onCreate(result.refinedLatexContent, compileResult.pdfUrl);
        }
        setChatHistory(prevChatHistory => [
          ...prevChatHistory,
          {
            role: 'assistant',
            chatMessage: result.chatMessage,
          },
        ]);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to refine LaTeX content",
          variant: "destructive",
        });
        setChatHistory(prevChatHistory => [
          ...prevChatHistory,
          {
            role: 'assistant',
            chatMessage: `Error refining LaTeX code: ${error.message}`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const mainContent = (
    <div className={`flex flex-col h-full p-4`}>
      {mode === 'seed' && chatHistory.length === 0 ? (
        <div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-2/5 flex flex-col items-center">
            <div className="w-full flex flex-col items-center">
              <ChatInput 
                onSend={handleSend} 
                loading={loading} 
                placeholder={'Describe your book idea or topic...'}
              />
            </div>
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full z-20 w-full flex flex-col items-center justify-end pb-6 pointer-events-none" style={{height: '50vh'}}>
            <div className="w-full">
              <h2 className="text-2xl font-semibold mb-2 text-gray-700 w-full text-center">What can I help you create today?</h2>
              <p className="text-gray-500 text-center mb-4 max-w-md w-full mx-auto">Describe your book idea, topic, or anything you'd like to write about. I'll help you get started!</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            ref={chatContainerRef}
            className="chat-scrollbar flex-grow min-h-0 max-h-[78.5vh] space-y-4 overflow-y-auto"
          >
            {chatHistory.map((message, index) => (
              <div key={index} className="w-full flex px-2">
                <div
                  className={`p-3 rounded-lg max-w-[75%] break-words inline-block ${
                    message.role === 'user'
                      ? 'bg-secondary text-secondary-foreground self-end ml-auto'
                      : 'bg-muted text-muted-foreground self-start mr-auto'
                  }`}
                >
                  {message.chatMessage}
                </div>
              </div>
            ))}
          </div>
          <div className="z-10 w-full flex flex-col items-center">
            <div className="w-full flex flex-col items-center">
              <ChatInput 
                onSend={handleSend} 
                loading={loading} 
                placeholder={'Describe your book idea or topic...'}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  return compact ? (
    <div className="w-2/5 max-w-full mx-auto h-full flex flex-col justify-center items-center">
      {mainContent}
    </div>
  ) : mainContent;
};

export default ChatScreen;
