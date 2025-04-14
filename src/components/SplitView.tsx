'use client';

import {useState, useEffect, useRef} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';

interface SplitViewProps {
  initialLatexCode: string;
}

const SplitView: React.FC<SplitViewProps> = ({initialLatexCode}) => {
  const [latexCode, setLatexCode] = useState<string>(initialLatexCode);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const pdfViewerRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const compileLatex = async () => {
      try {
        const response = await fetch('/api/compile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({latexCode: latexCode}),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setPdfUrl(data.pdfUrl);
      } catch (error: any) {
        console.error('Failed to compile LaTeX:', error);
        // Handle error appropriately (e.g., display an error message)
      }
    };

    compileLatex();
  }, [latexCode]);

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

  const handleZoomIn = () => {
    const iframe = pdfViewerRef.current;
    if (iframe) {
      // @ts-ignore
      iframe.contentWindow.postMessage('zoomIn', '*');
    }
  };

  const handleZoomOut = () => {
    const iframe = pdfViewerRef.current;
    if (iframe) {
      // @ts-ignore
      iframe.contentWindow.postMessage('zoomOut', '*');
    }
  };

  return (
    <div className="flex h-full">
      {/* Editor Pane */}
      <div className="w-1/2 p-4">
        <Textarea
          value={latexCode}
          onChange={e => setLatexCode(e.target.value)}
          placeholder="Enter LaTeX code here"
          className="font-mono h-full"
        />
      </div>

      {/* Preview Pane */}
      <div className="w-1/2 p-4 flex flex-col">
        {pdfUrl ? (
          <>
            <div className="flex justify-end mb-2">
              <Button onClick={handleZoomIn} className="mr-2">
                Zoom In
              </Button>
              <Button onClick={handleZoomOut} className="mr-2">
                Zoom Out
              </Button>
              <Button onClick={handleDownload}>Download PDF</Button>
            </div>
            <iframe
              ref={pdfViewerRef}
              src={pdfUrl}
              className="flex-grow"
              style={{width: '100%', height: '100%'}}
            />
          </>
        ) : (
          <p>Compiling LaTeX...</p>
        )}
      </div>
    </div>
  );
};

export default SplitView;
