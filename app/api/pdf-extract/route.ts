import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { requireAuth } from '@/lib/apiMiddleware';
import { checkRateLimit } from '@/lib/rateLimit';
import { handleApiError } from '@/lib/apiError';

const execFileAsync = promisify(execFile);
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10MB max limit

export async function POST(req: NextRequest) {
  // Authentication required to access PDF parsing service
  const { error } = await requireAuth(req);
  if (error) return error;

  // Rate limiting for computationally heavy processing
  const rateLimit = checkRateLimit(req, {
    windowMs: 5 * 60 * 1000,
    max: 15,
    message: 'PDF processing limit reached. Please wait a few minutes before uploading again.',
    keyPrefix: 'pdf-extract',
  });
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No PDF file uploaded' }, { status: 400 });
    }

    // Security: Check file size before buffering into memory
    if (file.size > MAX_PDF_SIZE_BYTES) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds maximum allowed limit (10MB)' },
        { status: 400 }
      );
    }

    // Security: Validate file extension
    const fileName = file.name || 'document.pdf';
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Invalid file format. Only PDF files are supported.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Verify PDF header magic bytes (%PDF-)
    if (buffer.length < 5 || buffer.toString('utf8', 0, 5) !== '%PDF-') {
      return NextResponse.json(
        { success: false, error: 'Uploaded file is not a valid PDF document' },
        { status: 400 }
      );
    }

    // Write to a temporary isolated file
    const tempFileName = `pdf_extract_${crypto.randomBytes(12).toString('hex')}.pdf`;
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
    } catch {
      // Fallback without layout flag if needed
      try {
        const { stdout } = await execFileAsync('/usr/bin/pdftotext', [tempFilePath, '-']);
        extractedText = stdout || '';
      } catch {
        return NextResponse.json(
          { success: false, error: 'Could not extract text from this PDF file' },
          { status: 422 }
        );
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
      filename: fileName,
      text: cleanedText,
      length: cleanedText.length,
    });
  } catch (err: unknown) {
    return handleApiError(err, 'Error processing PDF document');
  }
}
