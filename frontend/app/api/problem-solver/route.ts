import { NextResponse } from "next/server";

// CREATE A .env FILE IN THE FRONTEND FOLDER WITH BACKEND_DEV_URL AND BACKEND_PROD_URL VARIABLES
const BACKEND_URL = process.env.BACKEND_PROD_URL || process.env.BACKEND_DEV_URL;

export async function POST(req: Request) {
  const { message } = await req.json();

  const res = await fetch(`${BACKEND_URL}/api/problem-solver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
