import { useState, CSSProperties } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  placeholder?: string;
  minWidth?: CSSProperties['minWidth'];
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, loading, placeholder = 'Enter your prompt here', minWidth }) => {
  const [prompt, setPrompt] = useState<string>('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!prompt.trim()) return;
    onSend(prompt);
    setPrompt('');
  };

  return (
    <div
      className="flex items-center space-x-2 mt-2"
      style={minWidth ? { minWidth } : { minWidth: 420, width: '100%' }}
    >
      <div className="flex-grow relative">
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
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
  );
};

export default ChatInput; 