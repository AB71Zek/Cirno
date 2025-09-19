import { NextResponse } from "next/server";

// CREATE A .env FILE IN THE FRONTEND FOLDER WITH BACKEND_DEV_URL AND BACKEND_PROD_URL VARIABLES
const BACKEND_URL = process.env.BACKEND_PROD_URL || process.env.BACKEND_DEV_URL;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const res = await fetch(`${BACKEND_URL}/api/conversation/${sessionId}`, {
      method: "GET",
      headers: {
        'Cookie': req.headers.get('cookie') || '',
      },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get Messages API Route Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
