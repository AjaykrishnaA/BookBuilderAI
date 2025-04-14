
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latexCode = searchParams.get('content');
    const latexUrl = searchParams.get('url');

    if (!latexCode && !latexUrl) {
      return NextResponse.json(
        { error: 'Either content or url parameter must be provided' },
        { status: 400 }
      )
    }
    let apiUrl = "https://latex.ytotech.com/builds/sync";
    if (latexCode) {
      apiUrl += `?content=${encodeURIComponent(latexCode)}`;
    } else if (latexUrl) {
      apiUrl += `?url=${encodeURIComponent(latexUrl)}`;
    }

    try {
      const response = await fetch(apiUrl);
      if (response.ok) {
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        const pdfDataUrl = `data:application/pdf;base64,${base64}`;
        return NextResponse.json({ pdfUrl: pdfDataUrl });
      } else {
        return NextResponse.json(
          {
            error: `Compilation failed: ${response.statusText}`,
          },
          {
            status: response.status,
          }
        );
      }
    } catch (error: any) {
      console.error("Compilation error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Compilation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
