import { writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filename = `uploaded_${timestamp}_${file.name}`;
    
    // Save to public/images/products directory
    const publicDir = path.join(process.cwd(), 'public', 'images', 'products');
    const filePath = path.join(publicDir, filename);
    
    await writeFile(filePath, buffer);
    
    return NextResponse.json({ 
      success: true,
      path: `/images/products/${filename}`
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
}