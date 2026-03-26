import { NextRequest, NextResponse } from "next/server";

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Forward the file to the Python microservice
    const pythonFormData = new FormData();
    pythonFormData.append("file", file);

    const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/api/extract-pdf`, {
      method: "POST",
      body: pythonFormData,
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      throw new Error(`Python service error: ${pythonResponse.status} - ${errorText}`);
    }

    const data = await pythonResponse.json();

    return NextResponse.json(data);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Upload API Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process the PDF" },
      { status: 500 }
    );
  }
}
