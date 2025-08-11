import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'invoices';
    const backendUrl = `http://localhost:5000/api/${path}`;
    
    console.log('Proxy GET request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from backend' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
<<<<<<< HEAD
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'invoices';
    const backendUrl = `http://localhost:5000/api/${path}`;
    
    console.log('Proxy PUT request to:', backendUrl);
    
    const body = await request.json();
    
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
=======
    // Handle FormData uploads
    const formData = await request.formData();
    const backendUrl = 'https://backend-invoice-gen.onrender.com/api/invoice-upload';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
>>>>>>> 8fe3801ee96f7bdbd5ea5eaa66c193cfaeb4fa6b
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to update on backend' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'invoices';
    const backendUrl = `http://localhost:5000/api/${path}`;
    
    console.log('Proxy DELETE request to:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to delete on backend' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || 'invoice-upload';
    const backendUrl = `http://localhost:5000/api/${path}`;
    
    console.log('Proxy POST request to:', backendUrl);
    
    // Handle FormData uploads
    const formData = await request.formData();
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to backend' },
      { status: 500 }
    );
  }
} 