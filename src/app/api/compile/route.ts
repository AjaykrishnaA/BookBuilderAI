
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { latexCode } = await req.json();

    // Use local latex-on-http server
    const response = await fetch('http://localhost:3000/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: latexCode }),
    });

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Compilation failed: ${errorData.error}`);
    }

    const { pdfUrl } = await response.json();

    return NextResponse.json({pdfUrl});
  } catch (error: any) {
    console.error('Compilation error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
