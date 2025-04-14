import {NextResponse} from 'next/server';
import {existsSync, mkdirSync} from 'fs';
import {join} from 'path';
import {spawn} from 'child_process';

export async function POST(req: Request) {
  try {
    const {latexCode} = await req.json();

    // Create a unique directory for each compilation
    const compilationDir = join(
      process.cwd(),
      '.latex-temp',
      Date.now().toString()
    );
    if (!existsSync(compilationDir)) {
      mkdirSync(compilationDir, {recursive: true});
    }

    // Write LaTeX code to a file
    const texFilePath = join(compilationDir, 'document.tex');
    const fs = require('fs').promises;
    await fs.writeFile(texFilePath, latexCode);

    // Compile LaTeX code
    const pdflatex = spawn('pdflatex', [
      '-interaction=nonstopmode',
      '-output-directory=' + compilationDir,
      texFilePath,
    ]);

    // Capture pdflatex output
    let output = '';
    pdflatex.stdout.on('data', data => {
      output += data.toString();
    });

    pdflatex.stderr.on('data', data => {
      output += data.toString();
    });

    await new Promise((resolve, reject) => {
      pdflatex.on('close', code => {
        if (code === 0) {
          resolve(code);
        } else {
          console.error(`pdflatex exited with code ${code}, output: ${output}`);
          reject(new Error(`pdflatex failed with code ${code}`));
        }
      });
    });

    // Convert PDF to data URL
    const pdfFilePath = join(compilationDir, 'document.pdf');
    const pdfBuffer = await fs.readFile(pdfFilePath);
    const pdfBase64 = pdfBuffer.toString('base64');
    const pdfUrl = `data:application/pdf;base64,${pdfBase64}`;

    return NextResponse.json({pdfUrl});
  } catch (error: any) {
    console.error('Compilation error:', error);
    return NextResponse.json({error: error.message}, {status: 500});
  }
}
