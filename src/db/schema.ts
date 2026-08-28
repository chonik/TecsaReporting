import { pgTable, text, timestamp, integer, doublePrecision, boolean, pgEnum } from "drizzle-orm/pg-core";

export const unitTypeEnum = pgEnum("unit_type", ["METERS", "UNITS", "PERCENT", "CHECK"]);
export const projectStatusEnum = pgEnum("project_status", ["PLANNING", "IN_PROGRESS", "PAUSED", "COMPLETED"]);
export const reportStatusEnum = pgEnum("report_status", ["PENDING_APPROVAL", "APPROVED", "REJECTED"]);

// 1. Proyectos (ej: Gasoducto Tratayén - KM 12)
export const projects = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  client: text("client").notNull(), // ej: YPF, Vista, PAE
  location: text("location").notNull(), // ej: Loma Campana, Añelo
  status: projectStatusEnum("status").default("IN_PROGRESS").notNull(),
  startDate: timestamp("start_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Etapas / Frentes de Obra (ej: Movimiento de Suelo, Zanjeo y Tendido)
export const stages = pgTable("stages", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  orderIndex: integer("order_index").notNull().default(0),
  weightPercent: doublePrecision("weight_percent").default(0), // % de peso en la obra
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Tareas Preseteadas (ej: Zanjeo 1.40m, Soldadura 10", END)
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  stageId: text("stage_id").references(() => stages.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  unitType: unitTypeEnum("unit_type").notNull(), // METERS, UNITS, PERCENT, CHECK
  unitLabel: text("unit_label").notNull().default("u"), // m, juntas, %, check
  plannedQty: doublePrecision("planned_qty").notNull().default(0), // Total a hacer
  accumulatedQty: doublePrecision("accumulated_qty").notNull().default(0), // Acumulado oficial aprobado
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Partes Diarios (Reportes de Campo)
export const dailyReports = pgTable("daily_reports", {
  id: text("id").primaryKey(),
  projectId: text("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  reporterName: text("reporter_name").notNull(), // ej: Carlos Navarro
  crewCode: text("crew_code"), // ej: Cuadrilla A-4
  reportDate: text("report_date").notNull(), // YYYY-MM-DD
  rawAudioUrl: text("raw_audio_url"),
  audioTranscription: text("audio_transcription"),
  notes: text("notes"), // Observaciones / Novedades / Clima
  status: reportStatusEnum("status").default("PENDING_APPROVAL").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Items del Parte Diario (Avance por Tarea)
export const reportItems = pgTable("report_items", {
  id: text("id").primaryKey(),
  reportId: text("report_id").references(() => dailyReports.id, { onDelete: "cascade" }).notNull(),
  taskId: text("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  quantity: doublePrecision("quantity").notNull().default(0), // Metros o unidades reportadas hoy
  isCompleted: boolean("is_completed").default(false), // Para tareas binarias (checks)
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 6. Fotos / Evidencias de Obra
export const reportPhotos = pgTable("report_photos", {
  id: text("id").primaryKey(),
  reportId: text("report_id").references(() => dailyReports.id, { onDelete: "cascade" }).notNull(),
  photoUrl: text("photo_url").notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  locationName: text("location_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
