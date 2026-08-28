"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Mic,
  Sparkles,
  Camera,
  Send,
  CheckCircle2,
  Building2,
  HardHat,
  ChevronRight,
  RefreshCw,
  Clock,
  Check,
  X,
  Users,
} from "lucide-react";
import { INITIAL_PROJECT, TaskPreset, TaskUnitType } from "@/lib/mockData";
import { offlineDb, OfflinePendingReport } from "@/lib/dexie";

export default function CampoPage() {
  const [isOnline, setIsOnline] = useState(true);
  const [project] = useState(INITIAL_PROJECT);
  const [selectedStageId, setSelectedStageId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [onlyModified, setOnlyModified] = useState<boolean>(false);
  const [selectedCrew, setSelectedCrew] = useState<string>("A-4");

  // State: taskId -> { value: number | boolean, unitType: "PERCENT" | "CHECK" }
  const [taskProgress, setTaskProgress] = useState<{
    [taskId: string]: {
      value: number | boolean;
      unitType: TaskUnitType;
    };
  }>({});

  const [reportNotes, setReportNotes] = useState("");
  const [photos, setPhotos] = useState<Array<{ id: string; url: string; time: string }>>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);

  // Audio Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState<string | null>(null);
  const [aiDraftItems, setAiDraftItems] = useState<Array<{
    taskId: string;
    taskName: string;
    value: number | boolean;
    unitType: TaskUnitType;
  }>>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allTasks: TaskPreset[] = useMemo(() => {
    return project.stages.flatMap((s) => s.tasks);
  }, [project]);

  useEffect(() => {
    const updateOfflineCount = async () => {
      try {
        const count = await offlineDb.pendingReports.where("status").equals("QUEUED_OFFLINE").count();
        setPendingOfflineCount(count);
      } catch (e) {
        console.error("Dexie error:", e);
      }
    };
    updateOfflineCount();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      if (selectedStageId !== "all" && task.stageId !== selectedStageId) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesName = task.name.toLowerCase().includes(q);
        const matchesCat = task.category.toLowerCase().includes(q);
        const matchesStage = task.stageName.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesStage) return false;
      }
      if (onlyModified) {
        const entry = taskProgress[task.id];
        if (!entry) return false;
        if (entry.unitType === "CHECK" && !entry.value) return false;
        if (entry.unitType === "PERCENT" && (!entry.value || entry.value === 0)) return false;
      }
      return true;
    });
  }, [allTasks, selectedStageId, searchQuery, onlyModified, taskProgress]);

  const modifiedTasksCount = useMemo(() => {
    return Object.values(taskProgress).filter((entry) => {
      if (entry.unitType === "CHECK") return entry.value === true;
      return typeof entry.value === "number" && entry.value > 0;
    }).length;
  }, [taskProgress]);

  // Set % value (or clear if clicking the same)
  const setPercentValue = (taskId: string, percentVal: number) => {
    setTaskProgress((prev) => {
      const current = prev[taskId]?.value;
      if (current === percentVal) {
        const next = { ...prev };
        delete next[taskId];
        return next;
      }
      return {
        ...prev,
        [taskId]: { value: percentVal, unitType: "PERCENT" },
      };
    });
  };

  // Toggle Check value
  const toggleCheckValue = (taskId: string) => {
    setTaskProgress((prev) => {
      const current = Boolean(prev[taskId]?.value);
      if (current) {
        const next = { ...prev };
        delete next[taskId];
        return next;
      }
      return {
        ...prev,
        [taskId]: { value: true, unitType: "CHECK" },
      };
    });
  };

  // Audio Recording Handlers
  const startRecording = async () => {
    setAudioTranscript(null);
    setAiDraftItems([]);

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await handleAudioProcess(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Error accediendo al micrófono:", err);
      alert("No se pudo acceder al micrófono. Podés cargar los avances tocando las opciones % o Check abajo.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleAudioProcess = async (audioBlob: Blob) => {
    setIsProcessingAudio(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "reporte.webm");
      formData.append("tasks", JSON.stringify(allTasks));

      const res = await fetch("/api/audio/process", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAudioTranscript(json.data.full_transcription);
        if (json.data.crew_notes) setReportNotes(json.data.crew_notes);

        const draftList: typeof aiDraftItems = [];
        const newMap = { ...taskProgress };
        const rawItems = json.data.tasks_progress || [];

        for (const item of rawItems) {
          const targetId = item.task_id || "";
          const targetName = (item.task_name || "").toLowerCase();

          let matched = allTasks.find((t) => t.id === targetId);
          if (!matched && targetName) {
            matched = allTasks.find(
              (t) =>
                t.name.toLowerCase().includes(targetName) ||
                targetName.includes(t.name.toLowerCase()) ||
                t.category.toLowerCase().includes(targetName)
            );
          }

          if (matched) {
            let extractedVal: number | boolean = 0;
            if (matched.unitType === "CHECK") {
              extractedVal = true;
              newMap[matched.id] = { value: true, unitType: "CHECK" };
            } else {
              const qty = Number(item.quantity);
              extractedVal = !isNaN(qty) && qty > 0 ? qty : 50;
              newMap[matched.id] = { value: extractedVal, unitType: "PERCENT" };
            }

            draftList.push({
              taskId: matched.id,
              taskName: matched.name,
              value: extractedVal,
              unitType: matched.unitType,
            });
          }
        }

        setTaskProgress(newMap);
        setAiDraftItems(draftList);
      } else {
        alert("Error de Gemini API: " + (json.error || json.details || "No se pudo interpretar el audio."));
      }
    } catch (e: any) {
      console.error("Error procesando audio:", e);
      alert("Error de conexión al procesar audio: " + (e?.message || String(e)));
    } finally {
      setIsProcessingAudio(false);
    }
  };

  const removeDraftItem = (taskId: string) => {
    setTaskProgress((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
    setAiDraftItems((prev) => prev.filter((it) => it.taskId !== taskId));
  };

  // Photos
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photoUrl = URL.createObjectURL(file);
      setPhotos((prev) => [
        ...prev,
        {
          id: `photo-${Date.now()}-${i}`,
          url: photoUrl,
          time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  // Submit Report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modifiedTasksCount === 0) {
      alert("Por favor marcá al menos un % o un Check en las tareas.");
      return;
    }

    setIsSyncing(true);

    const itemsToSubmit = Object.entries(taskProgress)
      .filter(([_, entry]) => {
        if (entry.unitType === "CHECK") return entry.value === true;
        return typeof entry.value === "number" && entry.value > 0;
      })
      .map(([taskId, entry]) => {
        const taskObj = allTasks.find((t) => t.id === taskId);
        return {
          taskId,
          taskName: taskObj?.name || taskId,
          quantity: typeof entry.value === "number" ? entry.value : 100,
          isCompleted: typeof entry.value === "boolean" ? entry.value : entry.value === 100,
          unitLabel: taskObj?.unitType === "CHECK" ? "Check" : "%",
        };
      });

    const reportPayload: OfflinePendingReport = {
      localUuid: `rep-local-${Date.now()}`,
      projectId: project.id,
      reporterName: "Carlos Navarro (Capataz)",
      crewCode: `Cuadrilla ${selectedCrew}`,
      reportDate: new Date().toISOString().split("T")[0],
      items: itemsToSubmit,
      notes: reportNotes,
      photos: photos.map((p) => ({
        base64: p.url,
        latitude: -38.5412,
        longitude: -68.9124,
        timestamp: new Date().toISOString(),
      })),
      status: isOnline ? "SYNCED" : "QUEUED_OFFLINE",
      createdAt: Date.now(),
    };

    if (isOnline) {
      try {
        await fetch("/api/reports", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: reportPayload.projectId,
            reporterName: reportPayload.reporterName,
            crewCode: reportPayload.crewCode,
            reportDate: reportPayload.reportDate,
            notes: reportPayload.notes,
            audioTranscription: audioTranscript,
            items: reportPayload.items,
          }),
        });
      } catch (err) {
        console.warn("Guardando localmente en IndexedDB:", err);
        await offlineDb.pendingReports.add({ ...reportPayload, status: "QUEUED_OFFLINE" });
        setPendingOfflineCount((prev) => prev + 1);
      }
    } else {
      await offlineDb.pendingReports.add(reportPayload);
      setPendingOfflineCount((prev) => prev + 1);
    }

    setIsSyncing(false);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setAudioTranscript(null);
    setAiDraftItems([]);
    setPhotos([]);
    setReportNotes("");
    setTaskProgress({});
  };

  return (
    <div className="flex-1 max-w-lg mx-auto w-full p-3 sm:p-4 pb-32 space-y-4 font-sans">
      {/* Top Mobile Bar */}
      <header className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-2xl shadow-2xs sticky top-2 z-20 backdrop-blur-md bg-white/95">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
            <HardHat className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold text-slate-900 leading-tight">TECSA Campo</h1>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                PWA
              </span>
            </div>
            {/* Crew Selector */}
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Users className="w-3 h-3 text-slate-400" />
              <select
                value={selectedCrew}
                onChange={(e) => setSelectedCrew(e.target.value)}
                className="bg-transparent font-bold text-slate-700 underline focus:outline-none cursor-pointer"
              >
                <option value="A-4">Cuadrilla A-4 (Zanjeo y Tendido)</option>
                <option value="B-2">Cuadrilla B-2 (Soldadura 10")</option>
                <option value="C-1">Cuadrilla C-1 (Obras Civiles)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Offline Indicator */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`px-2 py-1 text-[10px] rounded-lg border font-bold flex items-center gap-1 transition ${
              isOnline
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {isOnline ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>4G</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Offline</span>
              </>
            )}
          </button>

          <Link
            href="/base"
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Ir a Base"
          >
            <Building2 className="w-4 h-4 text-slate-600" />
          </Link>
        </div>
      </header>

      {/* Offline Queue Badge */}
      {pendingOfflineCount > 0 && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs flex items-center justify-between text-amber-800">
          <div className="flex items-center gap-2 font-medium text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingOfflineCount} parte(s) guardados localmente sin señal</span>
          </div>
          <span className="text-[10px] font-bold underline cursor-pointer">Sincronizar</span>
        </div>
      )}

      {isSubmitted ? (
        /* SUCCESS CONFIRMATION */
        <div className="bg-white border border-slate-200 p-6 rounded-2xl text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">¡Parte Diario Enviado!</h3>
            <p className="text-xs text-slate-600">
              {isOnline
                ? "Recibido en Base Técnica. Estado: 🟡 Pendiente de Aprobación."
                : "Guardado en la memoria del celular. Se sincronizará apenas detecte señal 4G."}
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2">
            <p className="font-bold text-slate-900">Resumen cargado ({modifiedTasksCount} tareas):</p>
            {Object.entries(taskProgress).map(([taskId, entry]) => {
              if (entry.unitType === "CHECK" && !entry.value) return null;
              if (typeof entry.value === "number" && entry.value === 0) return null;
              const taskObj = allTasks.find((t) => t.id === taskId);
              return (
                <div key={taskId} className="flex justify-between items-center py-1 border-b border-slate-200/60 last:border-0 text-slate-700">
                  <span className="font-medium pr-2 truncate max-w-[200px]">{taskObj?.name || taskId}</span>
                  <span className="font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px]">
                    {entry.unitType === "CHECK" ? "✅ Realizada" : `${entry.value}%`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={resetForm}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              Nuevo Parte
            </button>
            <Link
              href="/base"
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1 shadow-2xs transition"
            >
              <span>Ver en Base</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* MAIN REPORT FORM */
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* 1. AUDIO RECORDING WITH RESILIENT DRAFT REVIEW */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Mic className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Dictar Avance por Voz</h3>
                  <p className="text-[10px] text-slate-400">OpenAI Whisper-1</p>
                </div>
              </div>

              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-3.5 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 animate-pulse"
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                  <span>Parar ({recordingTime}s)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isProcessingAudio}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95"
                >
                  {isProcessingAudio ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                  <span>{isProcessingAudio ? "Analizando..." : "Grabar Audio"}</span>
                </button>
              )}
            </div>

            {/* AI Draft Review */}
            {audioTranscript && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Transcripción de voz:</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      OpenAI Whisper ✓
                    </span>
                  </div>
                  <p className="italic text-slate-700 bg-white p-2 rounded-lg border border-slate-200 text-[11px] leading-relaxed mt-1">
                    "{audioTranscript}"
                  </p>
                </div>

                {aiDraftItems.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-slate-200">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                      <span>🎯 TAREAS DETECTADAS (TOCÁ PARA AJUSTAR):</span>
                      <span className="text-slate-400">{aiDraftItems.length} detectadas</span>
                    </div>

                    <div className="space-y-1.5">
                      {aiDraftItems.map((item) => (
                        <div
                          key={item.taskId}
                          className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded-lg shadow-2xs"
                        >
                          <p className="text-xs font-bold text-slate-900 truncate pr-2 max-w-[170px]">{item.taskName}</p>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {item.unitType === "CHECK" ? (
                              <button
                                type="button"
                                onClick={() => toggleCheckValue(item.taskId)}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                                  taskProgress[item.taskId]?.value ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {taskProgress[item.taskId]?.value ? "Hecho ✓" : "Pendiente"}
                              </button>
                            ) : (
                              <div className="flex items-center gap-1">
                                {[25, 50, 75, 100].map((pct) => (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => setPercentValue(item.taskId, pct)}
                                    className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                      taskProgress[item.taskId]?.value === pct
                                        ? "bg-purple-600 text-white"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {pct}%
                                  </button>
                                ))}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => removeDraftItem(item.taskId)}
                              className="p-1 text-slate-300 hover:text-red-500 ml-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. TASK CATALOG - 1 HORIZONTAL ROW: % OR CHECK ONLY */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-xs font-bold text-slate-900">Catálogo de Tareas ({allTasks.length})</h3>
                <p className="text-[10px] text-slate-400">Marcá porcentaje (%) o Check (✓)</p>
              </div>

              <button
                type="button"
                onClick={() => setOnlyModified(!onlyModified)}
                className={`px-2 py-0.5 text-[10px] rounded-lg font-bold transition ${
                  onlyModified
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {modifiedTasksCount} con avance
              </button>
            </div>

            {/* Stage Selector Pills */}
            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedStageId("all")}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition flex-shrink-0 ${
                  selectedStageId === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                Todas
              </button>
              {project.stages.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition flex-shrink-0 ${
                    selectedStageId === stage.id
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {stage.code}: {stage.name.split(". ")[1] || stage.name}
                </button>
              ))}
            </div>

            {/* TASK LIST - 1 STRICT SINGLE HORIZONTAL LINE PER TASK */}
            <div className="space-y-1.5 pt-1">
              {filteredTasks.map((task) => {
                const entry = taskProgress[task.id];
                const currentVal = entry?.value;
                const hasValue =
                  task.unitType === "CHECK"
                    ? Boolean(currentVal)
                    : typeof currentVal === "number" && currentVal > 0;

                return (
                  <div
                    key={task.id}
                    className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2.5 transition-all ${
                      hasValue
                        ? "bg-amber-50/70 border-amber-300 shadow-2xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {/* Left: Task Name & Category on 1 compact line */}
                    <div className="min-w-0 flex-1 pr-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          {task.category}
                        </span>
                        {task.unitType === "PERCENT" && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            • Acum: {task.accumulatedQty}%
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 truncate leading-tight mt-0.5" title={task.name}>
                        {task.name}
                      </h4>
                    </div>

                    {/* Right: Only 2 options (% or Check) in the exact same line */}
                    
                    {/* OPTION 1: PERCENTAGE BUTTONS */}
                    {task.unitType === "PERCENT" && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {[25, 50, 75, 100].map((pct) => {
                          const isSelected = (currentVal as number) === pct;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setPercentValue(task.id, pct)}
                              className={`px-2 py-1 text-xs font-bold rounded-lg border transition ${
                                isSelected
                                  ? "bg-purple-600 text-white border-purple-700 shadow-2xs scale-105"
                                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {pct === 100 ? "100%" : `${pct}%`}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* OPTION 2: CHECK BUTTON */}
                    {task.unitType === "CHECK" && (
                      <button
                        type="button"
                        onClick={() => toggleCheckValue(task.id)}
                        className={`px-3 py-1 text-xs font-bold flex items-center gap-1.5 border rounded-lg transition flex-shrink-0 ${
                          currentVal
                            ? "bg-emerald-600 text-white border-emerald-700 shadow-2xs"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {currentVal ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Hecho ✓</span>
                          </>
                        ) : (
                          <span>⚪ Pendiente</span>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. PHOTOS & NOTES */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 space-y-3 shadow-2xs">
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-900">
                📸 Fotos de Evidencia
              </label>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handlePhotoCapture}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition flex-1"
                >
                  <Camera className="w-4 h-4 text-amber-600" />
                  <span>Tomar Foto en Frente</span>
                </button>
              </div>

              {photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pt-2 pb-1">
                  {photos.map((p, idx) => (
                    <div
                      key={p.id}
                      className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden flex-shrink-0 bg-slate-100 shadow-2xs"
                    >
                      <img src={p.url} alt={`Evidencia ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(p.id)}
                        className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px]"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-slate-900">
                📝 Novedades / Clima / Observaciones
              </label>
              <textarea
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                rows={2}
                placeholder="Ej: Viento 45 km/h. Sin novedades HSE."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* STICKY BOTTOM ACTION BAR */}
          <div className="fixed bottom-0 inset-x-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 shadow-lg">
            <div className="max-w-lg mx-auto flex items-center gap-3">
              <div className="flex flex-col flex-1 pl-1">
                <span className="text-[11px] font-bold text-slate-900">
                  {modifiedTasksCount} {modifiedTasksCount === 1 ? "tarea cargada" : "tareas cargadas"}
                </span>
                <span className="text-[10px] text-slate-500">
                  {isOnline ? "🟢 Conectado" : "🟡 Modo Offline"}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSyncing}
                className="py-3 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-2 flex-shrink-0"
              >
                {isSyncing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Enviar Parte Diario</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
