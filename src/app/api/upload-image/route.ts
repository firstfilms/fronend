import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with credentials (saved from config.env)
// These can be moved to environment variables later if needed
cloudinary.config({
  cloud_name: 'dm1hykcaq',
  api_key: '929432983621763',
  api_secret: 'efA_VgryabUjk_ZUkR2IWPDJEuw',
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const imageType = formData.get('imageType') as string; // 'banner', 'signature', or 'stamp'
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'invoice-images',
          public_id: `${imageType}_${Date.now()}`,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(
              NextResponse.json(
                { error: 'Failed to upload image to Cloudinary', details: error.message },
                { status: 500 }
              )
            );
          } else {
            console.log('Cloudinary upload successful:', result?.secure_url);
            resolve(
              NextResponse.json({
                success: true,
                url: result?.secure_url,
                public_id: result?.public_id,
              })
            );
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error('Image upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process image upload', details: error.message },
      { status: 500 }
    );
  }
}

