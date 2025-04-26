
import { NextResponse } from "next/server";


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const latexCode = searchParams.get('content'); // Keep getting 'content' from the frontend request

    if (!latexCode) {
      return NextResponse.json(
        { error: 'The content parameter must be provided' },
        { status: 400 }
      )
    }

    // Use the new endpoint and parameter name 'text'
    const apiUrl = `https://latexonline.cc/compile?text=${encodeURIComponent(latexCode)}`;

    try {
      // The new endpoint might directly return the PDF, or a JSON response.
      // Let's assume it returns the PDF directly for now, similar to the old one.
      // Adjust error handling/response parsing if needed based on latexonline.cc's actual behavior.
      const response = await fetch(apiUrl);

      if (response.ok) {
        const blob = await response.blob();
        // Ensure the response is actually a PDF
        if (blob.type === 'application/pdf') {
            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64 = buffer.toString("base64");
            const pdfDataUrl = `data:application/pdf;base64,${base64}`;
            return NextResponse.json({ pdfUrl: pdfDataUrl });
        } else {
            // If it's not a PDF, it might be an error message from latexonline.cc
            const errorText = await response.text();
             return NextResponse.json(
              {
                error: `Compilation failed: ${response.statusText}. ${errorText}`,
              },
              {
                status: response.status,
              }
            );
        }
      } else {
         const errorText = await response.text();
         return NextResponse.json(
          {
            error: `Compilation failed: ${response.statusText}. ${errorText}`,
          },
          {
            status: response.status,
          }
        );
      }
    } catch (error: any) {
      console.error("Compilation error:", error);
      return NextResponse.json({ error: `Network or fetch error: ${error.message}` }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Request processing error:", error);
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 });
  }
}
