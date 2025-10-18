import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { fileUploadSchema } from '@/lib/validations/messaging';
import { ZodError } from 'zod';

// Mock file upload service for testing
class MockFileUploadService {
  async uploadFile(file: File): Promise<{ url: string; filename: string }> {
    // Simulate file upload delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Generate mock URL
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const mockFilename = `${timestamp}_${randomId}.${extension}`;
    const mockUrl = `https://mock-storage.example.com/uploads/${mockFilename}`;
    
    return {
      url: mockUrl,
      filename: file.name,
    };
  }

  validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type);
  }

  validateFileSize(file: File, maxSize: number): boolean {
    return file.size <= maxSize;
  }
}

const mockFileUploadService = new MockFileUploadService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get optional parameters
    const maxSizeParam = formData.get('maxSize');
    const allowedTypesParam = formData.get('allowedTypes');
    
    const uploadData = {
      file,
      ...(maxSizeParam && { maxSize: parseInt(maxSizeParam as string) }),
      ...(allowedTypesParam && { 
        allowedTypes: JSON.parse(allowedTypesParam as string) 
      }),
    };

    // Validate file upload
    const validatedData = fileUploadSchema.parse(uploadData);

    // Additional security checks
    if (!mockFileUploadService.validateFileType(file, validatedData.allowedTypes)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    if (!mockFileUploadService.validateFileSize(file, validatedData.maxSize)) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed size' },
        { status: 400 }
      );
    }

    // Simulate file upload
    const uploadResult = await mockFileUploadService.uploadFile(file);

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.url,
        filename: uploadResult.filename,
        type: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}