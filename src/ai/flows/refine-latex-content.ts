'use server';
/**
 * @fileOverview A flow to refine LaTeX content based on iterative conversations with the AI.
 *
 * - refineLatexContent - A function that handles the LaTeX content refinement process.
 * - RefineLatexContentInput - The input type for the refineLatexContent function.
 * - RefineLatexContentOutput - The return type for the refineLatexContent function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import Handlebars from 'handlebars';

// Register the 'eq' helper for Handlebars
Handlebars.registerHelper('eq', function(arg1, arg2) {
  return arg1 === arg2;
});

const RefineLatexContentInputSchema = z.object({
  latexContent: z.string().describe('The LaTeX content to refine.'),
  chatHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    chatMessage: z.string(),
  })).describe('The chat history of the conversation.'),
  prompt: z.string().describe('User prompt to refine the current latex content.'),
});
export type RefineLatexContentInput = z.infer<typeof RefineLatexContentInputSchema>;

const RefineLatexContentOutputSchema = z.object({
  refinedLatexContent: z.string().describe('The refined LaTeX content.'),
  chatMessage: z.string().describe('The message to display in the chat interface.'),
});
export type RefineLatexContentOutput = z.infer<typeof RefineLatexContentOutputSchema>;

export async function refineLatexContent(input: RefineLatexContentInput): Promise<RefineLatexContentOutput> {
  return refineLatexContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'refineLatexContentPrompt',
  input: {
    schema: z.object({
      latexContent: z.string().describe('The LaTeX content to refine.'),
      chatHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        chatMessage: z.string(),
      })).describe('The chat history of the conversation.'),
      prompt: z.string().describe('User prompt to refine the current latex content.'),
    }),
  },
  output: {
    schema: z.object({
      refinedLatexContent: z.string().describe('The refined LaTeX content.'),
      chatMessage: z.string().describe('The message to display in the chat interface.'),
    }),
  },
  prompt: `You are an AI assistant specialized in refining LaTeX content. A user is creating a book and wants to use you to refine the latex content iteratively based on their feedback.

      Here is the current LaTeX content:\n\n      {{{latexContent}}}\n\n      Here is the chat history:\n      {{#each chatHistory}}\n        {{#if (this.role)}}
          {{#if (this.role 'user')}}
            User: {{{this.chatMessage}}}
          {{else}}
            Assistant: {{{this.chatMessage}}}
          {{/if}}
        {{/if}}\n      {{/each}}\n
      Based on the chat history and the following prompt, refine the LaTeX content.
      Prompt: {{{prompt}}}

      Make sure the LaTeX content is valid and compiles without errors.
      Return both the refined LaTeX content and a friendly message explaining the changes made.
`,
});

const refineLatexContentFlow = ai.defineFlow<
  typeof RefineLatexContentInputSchema,
  typeof RefineLatexContentOutputSchema
>(
  {
    name: 'refineLatexContentFlow',
    inputSchema: RefineLatexContentInputSchema,
    outputSchema: RefineLatexContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
