import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const execFileAsync = promisify(execFile);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No PDF file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write to a temporary file
    const tempFileName = `pdf_extract_${crypto.randomBytes(8).toString('hex')}.pdf`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    await fs.writeFile(tempFilePath, buffer);

    let extractedText = '';
    try {
      // Run pdftotext to extract text directly from the PDF
      const { stdout } = await execFileAsync('/usr/bin/pdftotext', [
        '-layout',
        tempFilePath,
        '-', // stdout
      ]);
      extractedText = stdout || '';
    } catch (err: unknown) {
      // Fallback without layout flag if needed
      try {
        const { stdout } = await execFileAsync('/usr/bin/pdftotext', [tempFilePath, '-']);
        extractedText = stdout || '';
      } catch (fallbackErr: unknown) {
        const msg = fallbackErr instanceof Error ? fallbackErr.message : 'pdftotext execution failed';
        return NextResponse.json({ success: false, error: `Could not parse PDF: ${msg}` }, { status: 500 });
      }
    } finally {
      // Always safely clean up temporary file
      await fs.unlink(tempFilePath).catch(() => {});
    }

    // Clean up excessive blank lines
    const cleanedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({
      success: true,
      filename: file.name,
      text: cleanedText,
      length: cleanedText.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error processing PDF';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
