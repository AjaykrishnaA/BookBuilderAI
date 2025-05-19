'use client';

import {useState, useRef, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {generateLatexBook} from '@/ai/flows/generate-latex-book';
import {refineLatexContent} from '@/ai/flows/refine-latex-content';
import { useLatexCompiler } from '@/hooks/use-latex-compiler';
import { useToast } from '@/hooks/use-toast';

interface ChatScreenProps {
  onCreate: (latexCode: string, pdfUrl: string, bookId?: string) => void;
  latexCode?: string;
  chatHistory: {role: 'user' | 'assistant'; chatMessage: string}[];
  setChatHistory: React.Dispatch<React.SetStateAction<{role: 'user' | 'assistant'; chatMessage: string}[]>>;
}

const ChatScreen: React.FC<ChatScreenProps> = ({onCreate, latexCode = '', chatHistory, setChatHistory}) => {
  const [prompt, setPrompt] = useState<string>('');
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

  const handleSend = async () => {
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
    setPrompt(''); // Clear the prompt input after sending
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
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
      <div className="flex items-center space-x-2 mt-2">
        <div className="flex-grow relative">
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your prompt here"
            className="pr-12 rounded-lg"
            rows={1}
          />
          <Button 
            onClick={handleSend} 
            disabled={loading || !prompt.trim()}
            className={`absolute right-2 bottom-2 h-8 w-8 p-0 transition-colors ${
              !prompt.trim() 
                ? 'bg-primary hover:bg-muted text-primary-foreground' 
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
            variant="ghost"
          >
            {loading ? (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="-rotate-90"
              >
                <path 
                  d="M5 12H19M19 12L12 5M19 12L12 19" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
