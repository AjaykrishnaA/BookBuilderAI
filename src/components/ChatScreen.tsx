'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {generateLatexBook} from '@/ai/flows/generate-latex-book';
import {refineLatexContent} from '@/ai/flows/refine-latex-content';

interface ChatScreenProps {
  onCreate: (latexCode: string) => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({onCreate}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<
    {role: 'user' | 'assistant'; content: string}[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSend = async () => {
    setLoading(true);
    setChatHistory([...chatHistory, {role: 'user', content: prompt}]);

    if (chatHistory.length === 0) {
      // Initial book generation
      try {
        const result = await generateLatexBook({prompt: prompt});
        setChatHistory(prevChatHistory => [
          ...prevChatHistory,
          {role: 'assistant', content: 'Here is the initial LaTeX code.'},
        ]);
        onCreate(result.latexCode);
      } catch (error: any) {
        setChatHistory(prevChatHistory => [
          ...prevChatHistory,
          {
            role: 'assistant',
            content: `Error generating LaTeX code: ${error.message}`,
          },
        ]);
      } finally {
        setLoading(false);
      }
    } else {
      // Refine existing LaTeX code
      try {
        // Assuming you have stored the LaTeX code in a state variable
        const lastLatexCode = chatHistory.findLast(
          message => message.role === 'assistant'
        )?.content;

        if (!lastLatexCode) {
          throw new Error('No previous LaTeX code found in chat history.');
        }

        // Call refineLatexContent to get refined LaTeX code
        const result = await refineLatexContent({
          latexContent: lastLatexCode,
          chatHistory: [...chatHistory, {role: 'user', content: prompt}],
          prompt: prompt,
        });
        setChatHistory(prevChatHistory => [
          ...prevChatHistory,
          {
            role: 'assistant',
            content: result.refinedLatexContent,
          },
        ]);
        onCreate(result.refinedLatexContent); // Update LaTeX code state
      } catch (error: any) {
        setChatHistory(prevChatHistory => [
          ...prevChatHistory,
          {
            role: 'assistant',
            content: `Error refining LaTeX code: ${error.message}`,
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
          <div
            key={index}
            className={`p-3 rounded-lg ${
              message.role === 'user'
                ? 'bg-secondary text-secondary-foreground self-end'
                : 'bg-muted text-muted-foreground self-start'
            }`}
          >
            {message.content}
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
