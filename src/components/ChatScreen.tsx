'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {generateLatexBook} from '@/ai/flows/generate-latex-book';
import {refineLatexContent} from '@/ai/flows/refine-latex-content';

interface ChatScreenProps {
  onCreate: (latexCode: string) => void;
  latexCode?: string;
  chatHistory: {role: 'user' | 'assistant'; chatMessage: string}[];
  setChatHistory: React.Dispatch<React.SetStateAction<{role: 'user' | 'assistant'; chatMessage: string}[]>>;
}

const ChatScreen: React.FC<ChatScreenProps> = ({onCreate, latexCode = '', chatHistory, setChatHistory}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

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
        onCreate(result.latexCode);
        console.log('Initial LaTeX code generated');
      } catch (error: any) {
        setChatHistory(prevChatHistory => [
          ...prevChatHistory,
          {
            role: 'assistant',
            chatMessage: `Error generating LaTeX code: ${error.message}`,
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
        console.log("latexCodeBeforeRefining : ", latexCode);
        const result = await refineLatexContent({
          latexContent: latexCode,
          chatHistory: [...chatHistory, {role: 'user', chatMessage: prompt}],
          prompt: prompt,
        });
        console.log("latexCodeAfterRefining : ", result.refinedLatexContent);
        setChatHistory(prevChatHistory => [
          ...prevChatHistory,
          {
            role: 'assistant',
            chatMessage: result.chatMessage,
          },
        ]);
        onCreate(result.refinedLatexContent);
      } catch (error: any) {
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

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-grow space-y-4 overflow-y-auto">
        {chatHistory.map((message, index) => (
          <div key={index} className="w-full flex">
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
      <div className="flex items-center space-x-2">
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter your prompt here"
          className="flex-grow"
        />
        <Button onClick={handleSend} disabled={loading}>
          {loading ? 'Loading...' : 'Send'}
        </Button>
      </div>
    </div>
  );
};

export default ChatScreen;
