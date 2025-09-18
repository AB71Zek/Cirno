import { NextResponse } from "next/server";

// CREATE A .env FILE IN THE FRONTEND FOLDER WITH BACKEND_DEV_URL AND BACKEND_PROD_URL VARIABLES
const BACKEND_URL = process.env.BACKEND_PROD_URL || process.env.BACKEND_DEV_URL;

export async function POST(req: Request) {
  try {
    // Check if the request contains FormData (for file uploads)
    const contentType = req.headers.get("content-type");
    
    if (contentType?.includes("multipart/form-data")) {
      // Handle FormData (with image upload)
      const formData = await req.formData();
      
      const res = await fetch(`${BACKEND_URL}/api/conversation/problem-solver`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      return NextResponse.json(data);
    } else {
      // Handle JSON (text-only messages)
      const { message, sessionId } = await req.json();

      const res = await fetch(`${BACKEND_URL}/api/conversation/problem-solver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, sessionId }),
      });

      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
