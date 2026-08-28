import fs from "fs";
import path from "path";

export interface StoredReportItem {
  taskId: string;
  taskName: string;
  stageName?: string;
  plannedTotal?: number;
  priorAccumulated?: number;
  quantity: number;
  unit: string;
  unitType: "PERCENT" | "CHECK";
  isCompleted?: boolean;
}

export interface StoredReport {
  id: string;
  reporterName: string;
  crewCode: string;
  time: string;
  project: string;
  weather: string;
  notes: string;
  audioTranscript: string;
  photosCount: number;
  items: StoredReportItem[];
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  createdAt: number;
}

const INITIAL_STORED_REPORTS: StoredReport[] = [
  {
    id: "PARTE-0827-01",
    reporterName: "Carlos Navarro",
    crewCode: "Cuadrilla A-4 (Zanjeo y Tendido)",
    time: "Hoy 18:42 hs",
    project: "Gasoducto Loop Tratayén - KM 12",
    weather: "Viento 45-50 km/h • Temperatura 14°C • Sin incidentes HSE",
    notes: "Se avanzó con buen ritmo en el tramo norte antes del incremento de viento vespertino.",
    audioTranscript:
      "\"Buenas tardes base técnica, acá Carlos Navarro. Hoy en Tratayén avanzamos en el zanjeo y soldaduras, completamos la inspección de tintas y avanzamos en el cruce de ruta con la DDH. Viento fuerte a la tarde pero la cuadrilla rindió bien.\"",
    photosCount: 2,
    status: "PENDING_APPROVAL",
    createdAt: Date.now() - 3600000 * 2,
    items: [
      {
        taskId: "t-201",
        taskName: "Zanjeo Mecánico Profundidad 1.40m",
        stageName: "2. Zanjeo y Tendido",
        quantity: 50,
        unit: "%",
        unitType: "PERCENT",
      },
      {
        taskId: "t-302",
        taskName: "Soldadura de Juntas a Tope 10\"",
        stageName: "3. Soldadura y Revestimiento",
        quantity: 25,
        unit: "%",
        unitType: "PERCENT",
      },
      {
        taskId: "t-401",
        taskName: "Inspección Visual y Tintas Penetrantes (PT)",
        stageName: "4. Calidad y Ensayos END",
        quantity: 100,
        unit: "Check",
        unitType: "CHECK",
        isCompleted: true,
      },
      {
        taskId: "t-205",
        taskName: "Perforación Horizontal Dirigida (DDH) Cruce Ruta 7",
        stageName: "2. Zanjeo y Tendido",
        quantity: 25,
        unit: "%",
        unitType: "PERCENT",
      },
    ],
  },
  {
    id: "PARTE-0826-03",
    reporterName: "Miguel Alarcón",
    crewCode: "Cuadrilla B-2 (Obras Civiles)",
    time: "Ayer 19:15 hs",
    project: "Gasoducto Loop Tratayén - KM 12",
    weather: "Despejado • Temperatura 18°C",
    notes: "Hormigonado de dados de anclaje completado en progresiva KM 11.8.",
    audioTranscript:
      "\"Buenas tardes, se hormigonaron dados de anclaje para trampa de scraper y se colocó señalización.\"",
    photosCount: 3,
    status: "APPROVED",
    createdAt: Date.now() - 86400000,
    items: [
      {
        taskId: "t-503",
        taskName: "Construcción de Dados de Hormigón / Placas de Anclaje",
        stageName: "5. Tapada, Obras Civiles y Cierre",
        quantity: 50,
        unit: "%",
        unitType: "PERCENT",
      },
    ],
  },
];

// Global in-memory variable (preserves state across requests in Next.js dev server)
declare global {
  var __GLOBAL_REPORTS_STORE__: StoredReport[] | undefined;
}

export function getReports(): StoredReport[] {
  if (!global.__GLOBAL_REPORTS_STORE__) {
    global.__GLOBAL_REPORTS_STORE__ = [...INITIAL_STORED_REPORTS];
  }
  return global.__GLOBAL_REPORTS_STORE__;
}

export function addReport(newReport: StoredReport): StoredReport {
  const current = getReports();
  // prepend so latest is first
  global.__GLOBAL_REPORTS_STORE__ = [newReport, ...current];
  return newReport;
}

export function updateReportStatus(reportId: string, status: "APPROVED" | "REJECTED"): StoredReport | null {
  const current = getReports();
  const index = current.findIndex((r) => r.id === reportId);
  if (index === -1) return null;

  current[index] = {
    ...current[index],
    status,
  };
  global.__GLOBAL_REPORTS_STORE__ = [...current];
  return current[index];
}
