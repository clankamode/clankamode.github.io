import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Verify it's a PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Check file size (OpenAI supports up to 512MB)
    const maxSize = 512 * 1024 * 1024; // 512MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 512MB limit' },
        { status: 400 }
      );
    }

    // Upload to OpenAI Files API
    const uploadedFile = await openai.files.create({
      file: file,
      purpose: 'user_data',
    });

    return NextResponse.json({
      file_id: uploadedFile.id,
      filename: uploadedFile.filename,
      bytes: uploadedFile.bytes,
    });
  } catch (error) {
    console.error('Error uploading PDF to OpenAI:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to upload PDF to OpenAI',
      },
      { status: 500 }
    );
  }
}

