import { NextRequest, NextResponse } from "next/server";
import { transcribeWithWhisper } from "@/lib/whisper";
import { parseTranscriptionToTasks, processFieldAudio } from "@/lib/gemini";

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

    // 1. INTENTO PRINCIPAL CON OPENAI WHISPER-1
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("🎙️ [Pipeline] Procesando audio con OpenAI Whisper-1...");
        const whisperText = await transcribeWithWhisper(audioFile);

        if (whisperText && whisperText.trim().length > 0) {
          console.log("🧠 [Pipeline] Mapeando tareas con Gemini 3.5 a partir del texto de Whisper...");
          const structuredData = await parseTranscriptionToTasks(whisperText, availableTasks);
          return NextResponse.json({
            success: true,
            engine: "OpenAI Whisper-1",
            data: structuredData,
          });
        }
      } catch (whisperError: any) {
        console.warn("⚠️ Error en OpenAI Whisper, usando fallback Gemini:", whisperError.message);
      }
    }

    // 2. FALLBACK CON GEMINI DIRECTO
    console.log("🎙️ [Pipeline] Procesando audio directo con Gemini...");
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const audioBase64 = buffer.toString("base64");
    const mimeType = audioFile.type || "audio/webm";

    const extractedData = await processFieldAudio(audioBase64, mimeType, availableTasks);

    return NextResponse.json({
      success: true,
      engine: "Gemini 3.5",
      data: extractedData,
    });
  } catch (error: any) {
    console.error("Error al procesar audio:", error);
    return NextResponse.json(
      {
        error: "Error interno al procesar audio con IA",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
