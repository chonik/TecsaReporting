import { NextRequest, NextResponse } from "next/server";
import { processFieldAudio } from "@/lib/gemini";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const tasksJson = formData.get("tasks") as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo de audio." },
        { status: 400 }
      );
    }

    const availableTasks = tasksJson ? JSON.parse(tasksJson) : [];

    // Convert audio File to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString("base64");
    const mimeType = audioFile.type || "audio/webm";

    // Call Gemini 3.7 Flash
    const extractedData = await processFieldAudio(audioBase64, mimeType, availableTasks);

    return NextResponse.json({
      success: true,
      data: extractedData,
    });
  } catch (error: any) {
    console.error("Error al procesar audio con Gemini:", error);
    return NextResponse.json(
      {
        error: "Error interno al procesar audio con IA",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
