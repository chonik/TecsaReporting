"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Clock,
  HardHat,
  ChevronLeft,
  FileText,
  TrendingUp,
  Volume2,
  Camera,
  MapPin,
  Check,
  AlertTriangle,
  Download,
  Share2,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
  Printer,
  X,
  Edit3,
  Calendar,
  Building2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { INITIAL_PROJECT } from "@/lib/mockData";

interface PendingReportItem {
  taskId: string;
  taskName: string;
  stageName?: string;
  quantity: number;
  unit: string;
  unitType: "PERCENT" | "CHECK";
  isCompleted?: boolean;
}

interface PendingReport {
  id: string;
  reporterName: string;
  crewCode: string;
  time: string;
  project: string;
  weather: string;
  notes: string;
  audioTranscript: string;
  photosCount: number;
  items: PendingReportItem[];
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
}

export default function BasePage() {
  const [projectProgress, setProjectProgress] = useState(42.8);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedReportForPdf, setSelectedReportForPdf] = useState<PendingReport | null>(null);
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  // State to track which report cards are expanded
  const [expandedReports, setExpandedReports] = useState<{ [reportId: string]: boolean }>({});

  const [reports, setReports] = useState<PendingReport[]>([]);

  // Fetch live reports from API
  const fetchLiveReports = async () => {
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      const json = await res.json();
      if (json.success && Array.isArray(json.reports)) {
        setReports(json.reports);
        // Expand the first pending report by default if none selected
        if (json.reports.length > 0) {
          const firstPending = json.reports.find((r: PendingReport) => r.status === "PENDING_APPROVAL");
          if (firstPending) {
            setExpandedReports((prev) => ({
              ...prev,
              [firstPending.id]: prev[firstPending.id] !== undefined ? prev[firstPending.id] : true,
            }));
          }
        }
      }
    } catch (e) {
      console.error("Error consultando partes:", e);
    }
  };

  useEffect(() => {
    fetchLiveReports();
    // Auto-refresh every 3 seconds to capture new reports in real time
    const interval = setInterval(fetchLiveReports, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleReportExpand = (reportId: string) => {
    setExpandedReports((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  const approveReport = async (reportId: string) => {
    try {
      await fetch(`/api/reports/${reportId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE", approvedBy: "Jefe de Obra (Oficina Técnica)" }),
      });

      setProjectProgress((prev) => Math.min(100, Number((prev + 3.5).toFixed(1))));

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "APPROVED" } : r))
      );
    } catch (e) {
      console.error("Error aprobando parte:", e);
    }
  };

  const rejectReport = async (reportId: string) => {
    try {
      await fetch(`/api/reports/${reportId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", rejectionReason: "Requiere verificación en campo" }),
      });

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "REJECTED" } : r))
      );
    } catch (e) {
      console.error("Error rechazando parte:", e);
    }
  };

  const openPdfForReport = (report: PendingReport) => {
    setSelectedReportForPdf(report);
    setShowPdfModal(true);
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  const pendingCount = reports.filter((r) => r.status === "PENDING_APPROVAL").length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Top Desktop Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">TECSA Base • Panel de Control Técnico</h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>VIVO</span>
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {INITIAL_PROJECT.name} • Cliente: <span className="font-semibold text-slate-700">{INITIAL_PROJECT.client}</span> ({INITIAL_PROJECT.location})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openPdfForReport(reports[0] || null)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4 text-amber-600" />
              <span>Exportar Parte Oficial</span>
            </button>
            <Link
              href="/"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <HardHat className="w-4 h-4" />
              <span>Modo Campo (PWA)</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: PROJECT HEALTH & STAGES PROGRESS (4 COLS) */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Executive Summary Card */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado de Obra</span>
                <h3 className="text-sm font-bold text-slate-900">Avance Físico Ponderado</h3>
              </div>
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>

            <div className="space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-black font-mono text-amber-600">{projectProgress}%</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  +4.2% hoy
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${projectProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Calculado sobre {INITIAL_PROJECT.totalPlannedTasksCount} tareas y 5 etapas constructivas.
              </p>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] text-slate-500 font-semibold">Partes Recibidos</p>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{reports.length}</p>
                <p className="text-[10px] text-blue-600 font-semibold mt-0.5">{pendingCount} pendientes</p>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] text-slate-500 font-semibold">Cuadrillas Activas</p>
                <p className="text-base font-bold font-mono text-slate-900 mt-0.5">3 frentes</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">100% conectadas</p>
              </div>
            </div>
          </div>

          {/* Stage by Stage Breakdown */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-900">Avance por Etapa Constructiva</h3>
              <span className="text-[10px] text-slate-400">5 Etapas</span>
            </div>

            <div className="space-y-3">
              {INITIAL_PROJECT.stages.map((stage) => {
                const percent =
                  stage.id === "stage-1"
                    ? 96
                    : stage.id === "stage-2"
                    ? 38
                    : stage.id === "stage-3"
                    ? 28
                    : stage.id === "stage-4"
                    ? 22
                    : 14;

                return (
                  <div key={stage.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[200px]">
                        {stage.name}
                      </span>
                      <span className="font-mono font-bold text-slate-700">{percent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: PENDING APPROVAL QUEUE & COLLAPSIBLE CARDS (8 COLS) */}
        <section className="lg:col-span-8 space-y-5">
          <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Bandeja de Validación de Partes Diarios</h2>
                <p className="text-xs text-slate-500">
                  Revisá y aprobá los partes diarios cargados desde el campo (tocá cada parte para expandir o colapsar)
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-lg transition ${
                    statusFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Todos ({reports.length})
                </button>
                <button
                  onClick={() => setStatusFilter("PENDING_APPROVAL")}
                  className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                    statusFilter === "PENDING_APPROVAL"
                      ? "bg-white text-amber-900 shadow-2xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Pendientes</span>
                  {pendingCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold flex items-center justify-center">
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setStatusFilter("APPROVED")}
                  className={`px-3 py-1 rounded-lg transition ${
                    statusFilter === "APPROVED" ? "bg-white text-emerald-800 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Aprobados
                </button>
              </div>
            </div>

            {/* Reports List with Collapsible Cards */}
            <div className="space-y-3.5">
              {filteredReports.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl">
                    ✓
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">Bandeja al día</h4>
                  <p className="text-xs text-slate-500">No hay partes diarios en este filtro.</p>
                </div>
              ) : (
                filteredReports.map((report) => {
                  const isExpanded = Boolean(expandedReports[report.id]);

                  return (
                    <div
                      key={report.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        report.status === "PENDING_APPROVAL"
                          ? "bg-white border-amber-300 shadow-sm"
                          : report.status === "APPROVED"
                          ? "bg-white border-slate-200 hover:border-emerald-300"
                          : "bg-white border-red-200"
                      }`}
                    >
                      {/* COLLAPSIBLE HEADER */}
                      <div
                        onClick={() => toggleReportExpand(report.id)}
                        className={`p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none transition ${
                          isExpanded ? "border-b border-slate-100 bg-slate-50/50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                          <span
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              report.status === "PENDING_APPROVAL"
                                ? "bg-amber-500 animate-pulse"
                                : report.status === "APPROVED"
                                ? "bg-emerald-500"
                                : "bg-red-500"
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs font-mono text-slate-900">{report.id}</span>
                              <span className="text-xs text-slate-600 font-medium">
                                • {report.crewCode} ({report.reporterName})
                              </span>
                            </div>
                            {/* Summary row when collapsed */}
                            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{report.items?.length || 0} tareas cargadas</span>
                              <span>•</span>
                              {report.items?.slice(0, 3).map((it, idx) => (
                                <span key={idx} className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                                  {it.unitType === "CHECK" ? `${it.taskName.substring(0, 15)}: OK` : `${it.taskName.substring(0, 15)}: ${it.quantity}%`}
                                </span>
                              ))}
                              {(report.items?.length || 0) > 3 && (
                                <span className="text-[10px] text-slate-400">+{(report.items?.length || 0) - 3} más</span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-slate-500">{report.time}</span>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                              report.status === "PENDING_APPROVAL"
                                ? "bg-amber-100 text-amber-900 border-amber-200 font-bold"
                                : report.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-900 border-emerald-200"
                                : "bg-red-100 text-red-900 border-red-200"
                            }`}
                          >
                            {report.status === "PENDING_APPROVAL"
                              ? "🟡 PENDIENTE DE REVISIÓN"
                              : report.status === "APPROVED"
                              ? "✅ APROBADO EN BASE"
                              : "❌ RECHAZADO"}
                          </span>

                          {/* Chevron */}
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-800 transition">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* EXPANDED CONTENT BODY */}
                      {isExpanded && (
                        <div className="p-5 space-y-4 bg-white">
                          {/* Weather and Notes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                            <div>
                              <p className="text-slate-500 font-medium">Condiciones Climáticas & HSE:</p>
                              <p className="font-semibold text-slate-800 mt-0.5">{report.weather}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-medium">Observaciones de Cuadrilla:</p>
                              <p className="font-semibold text-slate-800 mt-0.5">{report.notes}</p>
                            </div>
                          </div>

                          {/* MULTI-TASK BREAKDOWN */}
                          <div className="space-y-2">
                            <p className="text-xs font-bold text-slate-900">
                              Avances reportados en este parte ({report.items?.length || 0} tareas):
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {report.items?.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-2xs hover:border-slate-300 transition"
                                >
                                  <div className="space-y-0.5 pr-2">
                                    <p className="text-xs font-bold text-slate-800 leading-tight">{item.taskName}</p>
                                    <p className="text-[10px] text-slate-400">ID: {item.taskId}</p>
                                  </div>

                                  <span
                                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap ${
                                      item.unitType === "CHECK"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-purple-50 text-purple-700 border-purple-200"
                                    }`}
                                  >
                                    {item.unitType === "CHECK" ? "✅ Realizada" : `${item.quantity}%`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* AUDIO & EVIDENCE */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                              <div className="flex items-center gap-1.5 text-amber-700 font-bold text-[11px]">
                                <Volume2 className="w-4 h-4" />
                                <span>Audio Transcrito (OpenAI Whisper):</span>
                              </div>
                              <p className="italic text-slate-600 text-[11px] leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                {report.audioTranscript}
                              </p>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <Camera className="w-4 h-4 text-amber-600" />
                                  Fotos de Evidencia ({report.photosCount || 1})
                                </span>
                                <span className="text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                                  Loma Campana (-38.54, -68.91)
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <div className="w-20 h-14 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono font-medium shadow-2xs">
                                  <span>Foto 1</span>
                                  <span className="text-[8px] text-emerald-600 font-bold">GPS OK ✓</span>
                                </div>
                                {report.photosCount > 1 && (
                                  <div className="w-20 h-14 rounded-lg bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-[10px] text-slate-500 font-mono font-medium shadow-2xs">
                                    <span>Foto 2</span>
                                    <span className="text-[8px] text-emerald-600 font-bold">GPS OK ✓</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Bar (Approval / Reject) */}
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => openPdfForReport(report)}
                              className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                            >
                              <Printer className="w-3.5 h-3.5 text-amber-600" />
                              <span>Ver PDF de este Parte</span>
                            </button>

                            {report.status === "PENDING_APPROVAL" && (
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => rejectReport(report.id)}
                                  className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
                                >
                                  ❌ Rechazar
                                </button>
                                <button
                                  onClick={() => approveReport(report.id)}
                                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                                >
                                  <Check className="w-4 h-4" />
                                  <span>Aprobar e Impactar Curva</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>

      {/* PRINT-READY OFFICIAL PARTE DIARIO MODAL */}
      {showPdfModal && selectedReportForPdf && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                  Documento Oficial de Obra
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">PARTE DIARIO • {selectedReportForPdf.id}</h3>
                <p className="text-xs text-slate-500">Proyecto: {INITIAL_PROJECT.name} • Cliente: {INITIAL_PROJECT.client}</p>
              </div>
              <button
                onClick={() => setShowPdfModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Content for Print */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px]">PARTE:</span>
                  <span className="font-bold text-slate-900">{selectedReportForPdf.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">CUADRILLA:</span>
                  <span className="font-bold text-slate-900">{selectedReportForPdf.crewCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">RESPONSABLE:</span>
                  <span className="font-bold text-slate-900">{selectedReportForPdf.reporterName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">ESTADO:</span>
                  <span className="font-bold text-emerald-700">{selectedReportForPdf.status}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tarea / Rubro</th>
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3 text-right">Avance Reportado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px]">
                    {selectedReportForPdf.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-semibold">{it.taskName}</td>
                        <td className="py-2.5 px-3 text-slate-500">{it.unitType}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                          {it.unitType === "CHECK" ? "Conforme (100%)" : `${it.quantity}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures Area */}
              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div className="text-center space-y-1">
                  <div className="border-b border-slate-300 w-3/4 mx-auto pb-6" />
                  <p className="font-bold text-[11px] text-slate-800">Firma Capataz / Supervisor</p>
                  <p className="text-[10px] text-slate-400">TECSA Constructora</p>
                </div>
                <div className="text-center space-y-1">
                  <div className="border-b border-slate-300 w-3/4 mx-auto pb-6" />
                  <p className="font-bold text-[11px] text-slate-800">Firma Jefe de Obra / Inspección</p>
                  <p className="text-[10px] text-slate-400">YPF S.A. / Operadora</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / Guardar como PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
