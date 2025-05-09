'use client';

import {useState, useEffect, useRef} from 'react';
import {Button} from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {Textarea} from '@/components/ui/textarea';
import {toast} from '@/hooks/use-toast';
import ChatScreen from './ChatScreen';

interface SplitViewProps {
  initialLatexCode: string;
  chatHistory: {role: 'user' | 'assistant'; chatMessage: string}[];
  setChatHistory: React.Dispatch<React.SetStateAction<{role: 'user' | 'assistant'; chatMessage: string}[]>>;
}

const SplitView: React.FC<SplitViewProps> = ({initialLatexCode, chatHistory, setChatHistory}) => {
  const [showChat, setShowChat] = useState<boolean>(false);
  const [latexCode, setLatexCode] = useState<string>(initialLatexCode);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [autoCompile, setAutoCompile] = useState<boolean>(true);
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const handleLatexCodeChange = (newLatexCode: string) => {
    setLatexCode(newLatexCode);
  };

  const compileLatex = async () => {
    const maxRetries = 20;
    let retryCount = 0;
    let delay = 1000; // Initial delay of 1 second

    while (retryCount < maxRetries) {
      const url = `/api/compile?content=${encodeURIComponent(latexCode)}`;
      try {
        const response = await fetch(url);

        if (!response.ok) {
          retryCount++;
          console.log(`Compile attempt ${retryCount} failed with status ${response.status}. Retrying in ${delay/1000} seconds`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay = Math.min(5000, delay * 2); // Exponential backoff, capped at 5000ms
          continue; // Retry
        }

        const data = await response.json();
        if (!data.pdfUrl) {
          throw new Error(data.error || 'Failed to compile LaTeX');
        }
        setPdfUrl(data.pdfUrl);
        return; // Success, exit the loop
      } catch (error: any) {
        console.error('Failed to compile LaTeX:', error);
        toast({
          title: 'Compilation Failed',
          description: `Failed to compile LaTeX after multiple retries: ${error.message}`,
          variant: 'destructive',
        });
        return; // Exit the loop after a non-recoverable error
      }
    }

    // If max retries reached
    toast({
      title: 'Compilation Failed',
      description: 'Maximum retry attempts reached. Please check your LaTeX code and try again.',
      variant: 'destructive',
    });
  };

  const handleRegenerate = () => {
    if (latexCode) {
      compileLatex();
    }
  };

  const handleRefresh = () => {
    if (pdfUrl && pdfViewerRef.current) {
      const timestamp = new Date().getTime();
      pdfViewerRef.current.src = `${pdfUrl}?t=${timestamp}`;
    }
  };

  useEffect(() => {
    if (!autoCompile) return; // Skip auto-compilation if disabled
    compileLatex();
  }, [latexCode, autoCompile]);

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'book.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Pane */}
      <div className="w-1/2 p-4 relative flex flex-col">
        <div className="mb-2">
          <Button
            onClick={() => setShowChat(!showChat)}
          >
            {showChat ? 'Show Editor' : 'Show Chat'}
          </Button>
        </div>
        <div className="flex-1">
          {showChat ? (
            <ChatScreen 
              onCreate={handleLatexCodeChange} 
              latexCode={latexCode}
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
            />
          ) : (
            <Textarea
              value={latexCode}
              onChange={e => {
                const target = e.target;
                const newValue = target.value;
                const cursorPosition = target.selectionStart;
                
                if (debounceTimerRef.current) {
                  clearTimeout(debounceTimerRef.current);
                }
                
                debounceTimerRef.current = setTimeout(() => {
                  setLatexCode(newValue);
                  // Restore cursor position after state update
                  requestAnimationFrame(() => {
                    target.setSelectionRange(cursorPosition, cursorPosition);
                  });
                }, 3000); // 500ms delay
              }}
              placeholder="Enter LaTeX code here"
              className="font-mono h-full"
            />
          )}
        </div>
      </div>

      {/* Right Pane (Preview) */}
      <div className="w-1/2 p-4 flex flex-col">
        {pdfUrl ? (
          <>
            <div className="flex justify-end space-x-2 mb-2">
              <Button 
                variant={autoCompile ? "default" : "outline"}
                onClick={() => setAutoCompile(!autoCompile)}
              >
                {autoCompile ? 'Auto Compile: On' : 'Auto Compile: Off'}
              </Button>
              <Button onClick={handleRegenerate} >
                Regenerate PDF
              </Button>
              <Button onClick={handleRefresh}>Refresh PDF</Button>
              <Button onClick={handleDownload} >
                  Download PDF
              </Button>            
            </div>
            <iframe
              ref={pdfViewerRef}
              src={pdfUrl}
              className="flex-grow"
              style={{width: '100%', height: '100%'}}
            />
          </>
        ) : (
          <div className="flex-grow">
              <Skeleton className="h-full w-full" />
            
          </div>

        )}
      </div>
    </div>
  );
};

export default SplitView;
