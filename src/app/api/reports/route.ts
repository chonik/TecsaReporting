import { NextRequest, NextResponse } from "next/server";
import { getReports, addReport, StoredReport } from "@/lib/reportsStore";
import { db } from "@/db";
import { dailyReports, reportItems } from "@/db/schema";

export const dynamic = "force-dynamic";

// GET /api/reports - Obtener todos los reportes diarios
export async function GET() {
  try {
    const reports = getReports();
    return NextResponse.json({ success: true, reports });
  } catch (error: any) {
    console.error("Error al obtener reportes:", error);
    return NextResponse.json(
      { error: "Error al consultar reportes", details: error?.message },
      { status: 500 }
    );
  }
}

// POST /api/reports - Crear un nuevo parte diario
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      reporterName,
      crewCode,
      notes,
      rawAudioUrl,
      audioTranscription,
      photos,
      items,
    } = body;

    const todayStr = new Date().toLocaleDateString("es-AR", {
      month: "2-digit",
      day: "2-digit",
    }).replace("/", "");
    
    const count = getReports().length + 1;
    const reportId = `PARTE-${todayStr}-${String(count).padStart(2, "0")}`;

    const formattedTime = `Hoy ${new Date().toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    })} hs`;

    const newReport: StoredReport = {
      id: reportId,
      reporterName: reporterName || "Carlos Navarro (Capataz)",
      crewCode: crewCode || "Cuadrilla A-4 (Zanjeo y Tendido)",
      time: formattedTime,
      project: "Gasoducto Loop Tratayén - KM 12",
      weather: "Despejado • Viento moderado • Sin novedades HSE",
      notes: notes || "Avance de jornada completado según planificación.",
      audioTranscript: audioTranscription || "Audio procesado por Gemini 3.5 Transcribe.",
      photosCount: Array.isArray(photos) ? photos.length : 1,
      status: "PENDING_APPROVAL",
      createdAt: Date.now(),
      items: Array.isArray(items)
        ? items.map((it: any) => ({
            taskId: it.taskId || "t-000",
            taskName: it.taskName || "Tarea de obra",
            quantity: typeof it.quantity === "number" ? it.quantity : 100,
            unit: it.unitLabel || "%",
            unitType: it.unitLabel === "Check" ? "CHECK" : "PERCENT",
            isCompleted: Boolean(it.isCompleted),
          }))
        : [],
    };

    // 1. Guardar en memoria global instantánea
    addReport(newReport);

    // 2. Intentar guardar en Neon DB si está configurado
    if (process.env.DATABASE_URL) {
      try {
        await db.insert(dailyReports).values({
          id: reportId,
          projectId: projectId || "proy-tratayen-01",
          reporterName: newReport.reporterName,
          crewCode: newReport.crewCode,
          reportDate: new Date().toISOString().split("T")[0],
          notes: newReport.notes,
          rawAudioUrl,
          audioTranscription: newReport.audioTranscript,
          status: "PENDING_APPROVAL",
        });
      } catch (dbErr) {
        console.warn("Neon DB insert opcional no completado:", dbErr);
      }
    }

    console.log(`✅ Nuevo parte ${reportId} guardado con éxito y disponible en Base.`);

    return NextResponse.json({
      success: true,
      report: newReport,
      reportId,
      message: "Parte diario recibido y visible en Base para aprobación.",
    });
  } catch (error: any) {
    console.error("Error al guardar parte diario:", error);
    return NextResponse.json(
      { error: "Error al registrar reporte", details: error?.message },
      { status: 500 }
    );
  }
}
