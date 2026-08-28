import { GoogleGenAI, Type } from "@google/genai";

function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
}

export interface ExtractedTaskProgress {
  task_id: string; // ID EXACTO de la tarea (ej: "t-101", "t-102", "t-103", "t-104", "t-201", etc.)
  task_name: string; // Nombre descriptivo
  quantity: number; // Cantidad numérica reportada
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
 * Procesa un archivo de audio usando Gemini 3.5 Flash Lite / 3.7 Flash y mapea exactamente los task_id del catálogo.
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
1. 'full_transcription': Escribí la transcripción textual y exacta de lo que dijo el usuario. No agregues ni quites nada.
2. Para cada tarea mencionada que tuvo avance HOY, seleccioná obligatoriamente su 'task_id' EXACTO de la lista de arriba:
   - "mojonado" / "relevamiento" -> task_id: "t-102"
   - "excavación" -> task_id: "t-103"
   - "cercado provisorio" / "señalización" -> task_id: "t-104"
   - "desbroce" / "apertura de pista" -> task_id: "t-101"
   - "zanjeo" -> task_id: "t-201"
   - "desfile de caños" -> task_id: "t-203"
   - "perforación horizontal" / "cruce DDH" -> task_id: "t-205"
   - "bajada de cañería" / "columna" -> task_id: "t-206"
   - "soldadura" -> task_id: "t-302"
   - "tintas penetrantes" / "inspección" -> task_id: "t-401"
3. Si el usuario dice "terminamos" o "hicimos", marcá 'is_completed': true.
4. Si el usuario no dice un número exacto (ej: "avanzamos bastante con la excavación"), poné una cantidad representativa estimada (ej: 50, 100, etc.) o el 100% si dice "terminamos".
5. IMPORTANTE: NO extraigas tareas que el usuario diga que son para MAÑANA (ej: "mañana queremos hacer el perfilado" -> eso NO se carga hoy).

Devolvé el resultado en JSON estructurado.
`;

  // Usamos gemini-3.5-flash-lite con fallback a gemini-3.7-flash (que soportan response_mime_type: "application/json")
  const modelsToTry = ["gemini-3.5-flash-lite", "gemini-3.7-flash"];
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
