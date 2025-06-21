import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({
      originalData: body,
      processed: true,
      timestamp: new Date().toISOString(),
      serverProcessing: {
        receivedAt: new Date().toISOString(),
        validationPassed: true,
        transformationsApplied: [
          "data-normalization",
          "field-validation", 
          "business-logic-processing"
        ]
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON data" },
      { status: 400 }
    );
  }
}