'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating LaTeX code for a book based on a user prompt.
 *
 * - generateLatexBook - A function that takes a prompt and returns LaTeX code.
 * - GenerateLatexBookInput - The input type for the generateLatexBook function.
 * - GenerateLatexBookOutput - The return type for the generateLatexBook function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateLatexBookInputSchema = z.object({
  prompt: z.string().describe('A prompt describing the book to be created.'),
});
export type GenerateLatexBookInput = z.infer<typeof GenerateLatexBookInputSchema>;

const GenerateLatexBookOutputSchema = z.object({
  latexCode: z.string().describe('The LaTeX code for the book content.'),
  chatMessage: z.string().describe('The message to display in the chat interface.'),
});
export type GenerateLatexBookOutput = z.infer<typeof GenerateLatexBookOutputSchema>;

export async function generateLatexBook(input: GenerateLatexBookInput): Promise<GenerateLatexBookOutput> {
  return generateLatexBookFlow(input);
}

const generateLatexBookPrompt = ai.definePrompt({
  name: 'generateLatexBookPrompt',
  input: {
    schema: z.object({
      prompt: z.string().describe('A prompt describing the book to be created.'),
    }),
  },
  output: {
    schema: z.object({
      latexCode: z.string().describe('The LaTeX code for the book content.'),
      chatMessage: z.string().describe('The message to display in the chat interface.'),
    }),
  },
  prompt: `You are a LaTeX expert. Generate LaTeX code for a book based on the following prompt:\n\nPrompt: {{{prompt}}}\n\nLaTeX Code: `,
});

const generateLatexBookFlow = ai.defineFlow<
  typeof GenerateLatexBookInputSchema,
  typeof GenerateLatexBookOutputSchema
>(
  {
    name: 'generateLatexBookFlow',
    inputSchema: GenerateLatexBookInputSchema,
    outputSchema: GenerateLatexBookOutputSchema,
  },
  async input => {
    const {output} = await generateLatexBookPrompt(input);
    return output!;
  }
);
