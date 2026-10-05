import { GoogleGenAI, Type } from "@google/genai";

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
}

export interface ExtractedTaskProgress {
  task_id: string; // ID EXACTO de la tarea (ej: "t-101", "t-102", "t-103", "t-104", "t-201", etc.)
  task_name: string; // Nombre descriptivo
  quantity: number; // Cantidad numérica reportada (% o 1)
  is_completed: boolean; // Si fue completada
  notes?: string;
}

export interface ExtractedReportAudio {
  project_reference?: string;
  tasks_progress: ExtractedTaskProgress[];
  weather_conditions?: string;
  crew_notes?: string;
  full_transcription: string;
}

/**
 * Mapea una transcripción de texto (generada por Whisper) a tareas estructuradas del catálogo.
 */
export async function parseTranscriptionToTasks(
  transcriptionText: string,
  availableTasks: Array<{ id: string; name: string; unitLabel: string; unitType: string; category?: string; plannedQty?: number }>
): Promise<ExtractedReportAudio> {
  const ai = getGenAIClient();

  const prompt = `
Sos el asistente de ingeniería de TECSA en Vaca Muerta, Neuquén, Argentina.
El capataz de campo dictó el siguiente mensaje (transcrito con OpenAI Whisper):

"""
${transcriptionText}
"""

CATÁLOGO DE TAREAS DISPONIBLES EN EL PROYECTO:
${JSON.stringify(
  availableTasks.map((t) => ({
    task_id: t.id,
    name: t.name,
    category: t.category,
    unit: t.unitLabel,
    type: t.unitType,
  })),
  null,
  2
)}

REGLAS DE EXTRACCIÓN:
1. 'full_transcription': Mantené la transcripción textual provista.
2. Para cada tarea con avance HOY mencionada en el texto, seleccioná su 'task_id' EXACTO del catálogo:
   - "mojonado" / "relevamiento" -> task_id: "t-102"
   - "excavación" -> task_id: "t-103"
   - "cercado provisorio" / "señalización" -> task_id: "t-104"
   - "desbroce" / "apertura de pista" -> task_id: "t-101"
   - "zanjeo" -> task_id: "t-201"
   - "perfilado" / "limpieza de fondo" -> task_id: "t-202"
   - "desfile de caños" -> task_id: "t-203"
   - "perforación horizontal" / "cruce DDH" -> task_id: "t-205"
   - "bajada de cañería" / "columna" -> task_id: "t-206"
   - "soldadura" -> task_id: "t-302"
   - "tintas penetrantes" / "inspección" -> task_id: "t-401"
3. Para porcentaje: Si dice "terminamos", "al 100%" o "listo", quantity = 100 e is_completed = true. Si dice "avanzamos bastante" o "la mitad", quantity = 50.
4. Para check: is_completed = true.
5. NO incluyas tareas que dijo que son para mañana.

Devolvé el resultado en JSON según el schema.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          project_reference: { type: Type.STRING },
          tasks_progress: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                task_id: { type: Type.STRING, description: "El ID exacto de la tarea seleccionada del catálogo" },
                task_name: { type: Type.STRING },
                quantity: { type: Type.NUMBER, description: "Porcentaje (25, 50, 75, 100) o 1" },
                is_completed: { type: Type.BOOLEAN, description: "true si completó la tarea" },
                notes: { type: Type.STRING },
              },
              required: ["task_id", "quantity", "is_completed"],
            },
          },
          weather_conditions: { type: Type.STRING },
          crew_notes: { type: Type.STRING },
          full_transcription: { type: Type.STRING },
        },
        required: ["tasks_progress", "full_transcription"],
      },
      temperature: 0.1,
    },
  });

  const parsed = JSON.parse(response.text || "{}") as ExtractedReportAudio;
  parsed.full_transcription = transcriptionText;
  return parsed;
}

/**
 * Procesa un archivo de audio directamente con Gemini (como fallback o modo nativo).
 */
export async function processFieldAudio(
  audioBase64: string,
  mimeType: string,
  availableTasks: Array<{ id: string; name: string; unitLabel: string; unitType: string; category?: string; plannedQty?: number }>
): Promise<ExtractedReportAudio> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("No se configuró la clave de API de Gemini (GEMINI_API_KEY en .env.local).");
  }

  const ai = getGenAIClient();

  const prompt = `
Sos el asistente de ingeniería de TECSA en Vaca Muerta, Neuquén, Argentina.
El capataz de campo te envió un audio describiendo lo que hicieron hoy en la obra.

CATÁLOGO EXACTO DE TAREAS DISPONIBLES:
${JSON.stringify(
  availableTasks.map((t) => ({
    task_id: t.id,
    name: t.name,
    category: t.category,
    unit: t.unitLabel,
    type: t.unitType,
  })),
  null,
  2
)}

REGLAS ESTRICTAS DE EXTRACCIÓN Y VINCULACIÓN:
1. 'full_transcription': Escribí la transcripción textual y exacta de lo que dijo el usuario.
2. Para cada tarea mencionada que tuvo avance HOY, seleccioná obligatoriamente su 'task_id' EXACTO de la lista.
3. Si el usuario dice "terminamos" o "hicimos", marcá 'is_completed': true y quantity = 100.
4. IMPORTANTE: NO extraigas tareas que el usuario diga que son para MAÑANA.

Devolvé el resultado en JSON estructurado.
`;

  const modelsToTry = ["gemini-3.8-flash"];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`🎙️ Procesando y vinculando tareas con ${modelName}...`);

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              data: audioBase64,
              mimeType: mimeType || "audio/webm",
            },
          },
          prompt,
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              project_reference: { type: Type.STRING },
              tasks_progress: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    task_id: { type: Type.STRING, description: "El ID exacto de la tarea seleccionada del catálogo (ej: t-101, t-102, t-103, t-104, t-201, etc.)" },
                    task_name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER, description: "Cantidad numérica o porcentaje (ej: 100, 50, 14, 1)" },
                    is_completed: { type: Type.BOOLEAN, description: "true si completó la tarea o hito" },
                    notes: { type: Type.STRING },
                  },
                  required: ["task_id", "quantity", "is_completed"],
                },
              },
              weather_conditions: { type: Type.STRING },
              crew_notes: { type: Type.STRING },
              full_transcription: { type: Type.STRING },
            },
            required: ["tasks_progress", "full_transcription"],
          },
          temperature: 0.1,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text) as ExtractedReportAudio;
        console.log("✅ Tareas vinculadas por Gemini:", JSON.stringify(parsed.tasks_progress, null, 2));
        return parsed;
      }
    } catch (err: any) {
      console.warn(`⚠️ Error con ${modelName}:`, err.message);
      lastError = err;
    }
  }

  throw new Error(`Error vinculando tareas con Gemini API: ${lastError?.message || "Error desconocido"}`);
}
