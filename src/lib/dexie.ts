import Dexie, { type Table } from "dexie";

export interface OfflinePendingReport {
  id?: number;
  localUuid: string;
  projectId: string;
  reporterName: string;
  crewCode: string;
  reportDate: string;
  items: Array<{
    taskId: string;
    taskName: string;
    quantity: number;
    isCompleted: boolean;
    unitLabel: string;
  }>;
  audioBlobBase64?: string;
  audioMimeType?: string;
  audioDurationSeconds?: number;
  photos: Array<{
    base64: string;
    latitude?: number;
    longitude?: number;
    timestamp: string;
  }>;
  notes: string;
  status: "QUEUED_OFFLINE" | "SYNCING" | "SYNCED" | "ERROR";
  createdAt: number;
}

export class TecsaReportingDatabase extends Dexie {
  pendingReports!: Table<OfflinePendingReport>;

  constructor() {
    super("TecsaVacaMuertaDB");
    this.version(1).stores({
      pendingReports: "++id, localUuid, projectId, status, createdAt",
    });
  }
}

export const offlineDb = new TecsaReportingDatabase();
