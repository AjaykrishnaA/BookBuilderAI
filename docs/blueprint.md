# **App Name**: BookBuilder AI

## Core Features:

- LaTeX Generation: AI-Powered Book Generation: Use Gemini LLM to generate LaTeX code for book content based on user prompts.
- AI Chat Screen: Chat Interface: A central chat screen for initial prompt input and iterative refinements using the LLM.
- Split View: Dual-Pane Layout: A split view with a markdown editor on the left for manual edits and a PDF preview with a download button on the right.
- PDF Compilation: LaTeX Compilation: Automatically compile the LaTeX code and display a PDF preview.
- AI Refinement Tool: Iterative Refinement: Maintain the chat interface for ongoing LLM interactions and adjustments to the book content using the chat history as a tool.

## Style Guidelines:

- Primary color: Neutral white or light grey for the background to enhance readability.
- Accent color: Teal (#008080) to highlight interactive elements like buttons and links.
- Use a monospaced font for the markdown editor to ensure consistent character width.
- The initial view should focus on the chat interface, with the split view (editor and preview) appearing after the 'create' action.
- The PDF preview pane should provide zoom and navigation controls.

## Original User Request:
create an ai book builder app that takes a prompt and builds a book written in latex using gemini llm calling. the initial app screen should be just a normal ai chatscreen at the center; which after clicking create will marginalise to the left side for continual llm changes. the app should showcase a pdf preview  with a download button on the right side, and a simple markdown editor on the left side; after getting the llm response and compiling the latex code.
  