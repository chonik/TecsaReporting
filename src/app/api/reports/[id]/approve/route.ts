import { NextRequest, NextResponse } from "next/server";
import { updateReportStatus } from "@/lib/reportsStore";
import { db } from "@/db";
import { dailyReports, reportItems, tasks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params;
    const body = await req.json();
    const { action, approvedBy, rejectionReason } = body; // action: 'APPROVE' | 'REJECT'

    const targetStatus = action === "REJECT" ? "REJECTED" : "APPROVED";

    // 1. Update in-memory global store
    updateReportStatus(reportId, targetStatus);

    // 2. Update in Neon DB if configured
    if (process.env.DATABASE_URL) {
      try {
        if (targetStatus === "REJECTED") {
          await db
            .update(dailyReports)
            .set({
              status: "REJECTED",
              rejectionReason: rejectionReason || "Observado por Oficina Técnica",
            })
            .where(eq(dailyReports.id, reportId));
        } else {
          await db
            .update(dailyReports)
            .set({
              status: "APPROVED",
              approvedBy: approvedBy || "Jefe de Obra (Oficina Técnica)",
              approvedAt: new Date(),
            })
            .where(eq(dailyReports.id, reportId));
        }
      } catch (dbErr) {
        console.warn("Neon DB update opcional:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      status: targetStatus,
      message: `Parte diario ${reportId} marcado como ${targetStatus}.`,
    });
  } catch (error: any) {
    console.error("Error al aprobar reporte:", error);
    return NextResponse.json(
      { error: "Error al procesar aprobación", details: error?.message },
      { status: 500 }
    );
  }
}
