import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface CompileResult {
  pdfUrl: string | null;
  error?: string;
}

export function useLatexCompiler() {
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  const compileLatex = async (latexCode: string): Promise<CompileResult> => {
    if (isCompiling) {
      return { pdfUrl: null, error: 'Compilation already in progress' };
    }

    setIsCompiling(true);
    const maxRetries = 20;
    let retryCount = 0;
    let delay = 1000; // Initial delay of 1 second

    try {
      while (retryCount < maxRetries) {
        try {
          const response = await fetch(`/api/compile?content=${encodeURIComponent(latexCode)}`);

          if (!response.ok) {
            retryCount++;
            console.log(`Compile attempt ${retryCount} failed with status ${response.status}. Retrying in ${delay/1000} seconds`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(5000, delay * 2); // Exponential backoff, capped at 5000ms
            continue;
          }

          const data = await response.json();
          if (!data.pdfUrl) {
            throw new Error(data.error || 'Failed to compile LaTeX');
          }
          return { pdfUrl: data.pdfUrl };
        } catch (error: any) {
          if (retryCount === maxRetries - 1) {
            throw error;
          }
        }
      }
      throw new Error('Maximum retry attempts reached');
    } catch (error: any) {
      console.error('Failed to compile LaTeX:', error);
      toast({
        title: 'Compilation Failed',
        description: `Failed to compile LaTeX: ${error.message}`,
        variant: 'destructive',
      });
      return { pdfUrl: null, error: error.message };
    } finally {
      setIsCompiling(false);
    }
  };

  return {
    compileLatex,
    isCompiling
  };
}