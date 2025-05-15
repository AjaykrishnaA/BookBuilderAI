'use client';

import {useState, useEffect, useRef} from 'react';
import {Button} from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {Textarea} from '@/components/ui/textarea';
import ChatScreen from './ChatScreen';
import { useLatexCompiler } from '@/hooks/use-latex-compiler';
import { useToast } from '@/hooks/use-toast';

interface SplitViewProps {
  initialLatexCode: string;
  initialPdfUrl: string | null;
  bookId?: string;
  chatHistory: {role: 'user' | 'assistant'; chatMessage: string}[];
  setChatHistory: React.Dispatch<React.SetStateAction<{role: 'user' | 'assistant'; chatMessage: string}[]>>;
}

const SplitView: React.FC<SplitViewProps> = ({
  initialLatexCode, 
  initialPdfUrl, 
  bookId,
  chatHistory, 
  setChatHistory
}) => {
  const [showChat, setShowChat] = useState<boolean>(false);
  const [latexCode, setLatexCode] = useState<string>(initialLatexCode);
  const [pdfUrl, setPdfUrl] = useState<string | null>(initialPdfUrl);
  const [autoCompile, setAutoCompile] = useState<boolean>(true);
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const { compileLatex, isCompiling } = useLatexCompiler();
  const { toast } = useToast();

  const handleLatexCodeChange = async (newLatexCode: string) => {
    setLatexCode(newLatexCode);
    if (autoCompile) {
      const result = await compileLatex(newLatexCode);
      if (result.pdfUrl) {
        setPdfUrl(result.pdfUrl);
        // Update book in database if we have a bookId
        if (bookId) {
          try {
            const response = await fetch('/api/books', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: bookId,
                latexContent: newLatexCode,
              }),
            });
            if (!response.ok) {
              toast({
                title: "Error",
                description: "Failed to update book in database",
                variant: "destructive",
              });
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to connect to database",
              variant: "destructive",
            });
          }
        }
      }
    }
  };

  const handleRegenerate = async () => {
    if (latexCode) {
      const result = await compileLatex(latexCode);
      if (result.pdfUrl) {
        setPdfUrl(result.pdfUrl);
      }
    }
  };

  const handleRefresh = () => {
    if (pdfUrl && pdfViewerRef.current) {
      const timestamp = new Date().getTime();
      pdfViewerRef.current.src = `${pdfUrl}?t=${timestamp}`;
    }
  };

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
                  handleLatexCodeChange(newValue);
                  // Restore cursor position after state update
                  requestAnimationFrame(() => {
                    target.setSelectionRange(cursorPosition, cursorPosition);
                  });
                }, 3000);
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
              <Button 
                onClick={handleRegenerate}
                disabled={isCompiling}
              >
                {isCompiling ? 'Compiling...' : 'Regenerate PDF'}
              </Button>
              <Button onClick={handleRefresh}>Refresh PDF</Button>
              <Button onClick={handleDownload}>
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
