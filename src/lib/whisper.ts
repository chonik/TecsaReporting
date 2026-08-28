import OpenAI from "openai";

const VACA_MUERTA_WHISPER_PROMPT =
  "Vocabulario técnico de obra en gasoductos y Vaca Muerta, Neuquén, Argentina: zanjeo, mojonado, topografía, excavación en roca, cercado provisorio, desfile de caños 10 pulgadas API 5L, perforación horizontal dirigida DDH, bajada de columna, alineación y biselado, soldadura de juntas, tintas penetrantes PT, gammagrafía RT, tapada de protección, cama de arena, Tratayén, Loma Campana, Añelo.";

/**
 * Transcribe un archivo de audio utilizando OpenAI Whisper (modelo whisper-1)
 * con prompting especializado para Vaca Muerta.
 */
export async function transcribeWithWhisper(audioFile: File): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("No se configuró OPENAI_API_KEY en las variables de entorno.");
  }

  const openai = new OpenAI({ apiKey });

  console.log(`🎙️ [Whisper] Enviando audio a OpenAI Whisper-1 (${audioFile.size} bytes, tipo: ${audioFile.type})...`);

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    language: "es",
    prompt: VACA_MUERTA_WHISPER_PROMPT,
    temperature: 0.2,
  });

  console.log("✅ [Whisper] Transcripción obtenida con éxito:", transcription.text);
  return transcription.text;
}
