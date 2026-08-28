export type TaskUnitType = "PERCENT" | "CHECK";

export interface TaskPreset {
  id: string;
  stageId: string;
  stageName: string;
  category: string;
  name: string;
  unitType: TaskUnitType;
  unitLabel: string; // % o Check
  plannedQty: number; // 100% o 1
  accumulatedQty: number; // % previo acumulado
  isCompleted?: boolean;
}

export interface StageInfo {
  id: string;
  name: string;
  code: string;
  weightPercent: number;
  tasks: TaskPreset[];
}

export interface ProjectInfo {
  id: string;
  name: string;
  client: string;
  location: string;
  status: string;
  totalPlannedTasksCount: number;
  stages: StageInfo[];
}

export const INITIAL_PROJECT: ProjectInfo = {
  id: "proy-tratayen-01",
  name: "Gasoducto Loop Tratayén - KM 12",
  client: "YPF S.A.",
  location: "Loma Campana, Añelo, Neuquén",
  status: "IN_PROGRESS",
  totalPlannedTasksCount: 142,
  stages: [
    {
      id: "stage-1",
      code: "E1",
      name: "1. Pista y Movimiento de Suelo",
      weightPercent: 15,
      tasks: [
        {
          id: "t-101",
          stageId: "stage-1",
          stageName: "Pista y Suelo",
          category: "Movimiento de Suelo",
          name: "Desbroce y Apertura de Pista (Ancho 25m)",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 95,
        },
        {
          id: "t-102",
          stageId: "stage-1",
          stageName: "Pista y Suelo",
          category: "Topografía",
          name: "Relevamiento Topográfico y Mojonado",
          unitType: "CHECK",
          unitLabel: "Check",
          plannedQty: 1,
          accumulatedQty: 1,
          isCompleted: true,
        },
        {
          id: "t-103",
          stageId: "stage-1",
          stageName: "Pista y Suelo",
          category: "Movimiento de Suelo",
          name: "Excavación en Roca con Martillo",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 60,
        },
        {
          id: "t-104",
          stageId: "stage-1",
          stageName: "Pista y Suelo",
          category: "HSE",
          name: "Señalización de Seguridad y Cercado Provisorio",
          unitType: "CHECK",
          unitLabel: "Check",
          plannedQty: 1,
          accumulatedQty: 1,
          isCompleted: true,
        },
      ],
    },
    {
      id: "stage-2",
      code: "E2",
      name: "2. Zanjeo, Desfile y Tendido",
      weightPercent: 30,
      tasks: [
        {
          id: "t-201",
          stageId: "stage-2",
          stageName: "Zanjeo y Tendido",
          category: "Zanjeo",
          name: "Zanjeo Mecánico Profundidad 1.40m",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 35,
        },
        {
          id: "t-202",
          stageId: "stage-2",
          stageName: "Zanjeo y Tendido",
          category: "Zanjeo",
          name: "Perfilado y Limpieza de Fondo de Zanja",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 30,
        },
        {
          id: "t-203",
          stageId: "stage-2",
          stageName: "Zanjeo y Tendido",
          category: "Cañería",
          name: "Desfile de Cañería 10\" API 5L en Pista",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 40,
        },
        {
          id: "t-204",
          stageId: "stage-2",
          stageName: "Zanjeo y Tendido",
          category: "Cañería",
          name: "Curvado de Caños en Frío con Máquina",
          unitType: "CHECK",
          unitLabel: "Check",
          plannedQty: 1,
          accumulatedQty: 0,
        },
        {
          id: "t-205",
          stageId: "stage-2",
          stageName: "Zanjeo y Tendido",
          category: "Cruces Especiales",
          name: "Perforación Horizontal Dirigida (DDH) Cruce Ruta 7",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 40,
        },
        {
          id: "t-206",
          stageId: "stage-2",
          stageName: "Zanjeo y Tendido",
          category: "Tendido",
          name: "Bajada de Cañería a Zanja con Sidebooms",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 15,
        },
      ],
    },
    {
      id: "stage-3",
      code: "E3",
      name: "3. Soldadura y Revestimiento",
      weightPercent: 30,
      tasks: [
        {
          id: "t-301",
          stageId: "stage-3",
          stageName: "Soldadura",
          category: "Preparación",
          name: "Alineación y Biselado de Extremos de Caño",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 35,
        },
        {
          id: "t-302",
          stageId: "stage-3",
          stageName: "Soldadura",
          category: "Soldadura",
          name: "Soldadura de Juntas a Tope 10\" (Pase Raíz + Relleno)",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 25,
        },
        {
          id: "t-303",
          stageId: "stage-3",
          stageName: "Soldadura",
          category: "Revestimiento",
          name: "Aplicación de Manta Termocontraíble en Juntas",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 20,
        },
        {
          id: "t-304",
          stageId: "stage-3",
          stageName: "Soldadura",
          category: "Control Calidad",
          name: "Ensayo Holiday Detector (Detección de Poros)",
          unitType: "CHECK",
          unitLabel: "Check",
          plannedQty: 1,
          accumulatedQty: 0,
        },
      ],
    },
    {
      id: "stage-4",
      code: "E4",
      name: "4. Calidad, Ensayos END y Prueba Hidráulica",
      weightPercent: 15,
      tasks: [
        {
          id: "t-401",
          stageId: "stage-4",
          stageName: "Calidad END",
          category: "Ensayos END",
          name: "Inspección Visual y Tintas Penetrantes (PT)",
          unitType: "CHECK",
          unitLabel: "Check",
          plannedQty: 1,
          accumulatedQty: 0,
        },
        {
          id: "t-402",
          stageId: "stage-4",
          stageName: "Calidad END",
          category: "Ensayos END",
          name: "Gammagrafía Industrial (Radiografiado 100% de Juntas)",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 20,
        },
        {
          id: "t-403",
          stageId: "stage-4",
          stageName: "Calidad END",
          category: "Ensayos END",
          name: "Ultrasonido Phased Array (PAUT)",
          unitType: "CHECK",
          unitLabel: "Check",
          plannedQty: 1,
          accumulatedQty: 0,
        },
        {
          id: "t-404",
          stageId: "stage-4",
          stageName: "Calidad END",
          category: "Prueba de Presión",
          name: "Llenado de Agua, Presurización y Prueba Hidráulica 24hs",
          unitType: "CHECK",
          unitLabel: "Check",
          plannedQty: 1,
          accumulatedQty: 0,
        },
      ],
    },
    {
      id: "stage-5",
      code: "E5",
      name: "5. Tapada, Obras Civiles y Cierre",
      weightPercent: 10,
      tasks: [
        {
          id: "t-501",
          stageId: "stage-5",
          stageName: "Tapada y Cierre",
          category: "Tapada",
          name: "Cama de Arena y Tapada de Protección Seleccionada",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 10,
        },
        {
          id: "t-502",
          stageId: "stage-5",
          stageName: "Tapada y Cierre",
          category: "Seguridad Subterránea",
          name: "Colocación de Malla Plástica de Advertencia Amarilla",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 10,
        },
        {
          id: "t-503",
          stageId: "stage-5",
          stageName: "Tapada y Cierre",
          category: "Obras Civiles",
          name: "Construcción de Dados de Hormigón / Placas de Anclaje",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 12,
        },
        {
          id: "t-504",
          stageId: "stage-5",
          stageName: "Tapada y Cierre",
          category: "Medio Ambiente",
          name: "Restitución Topográfica y Recomposición Ambiental de Pista",
          unitType: "PERCENT",
          unitLabel: "%",
          plannedQty: 100,
          accumulatedQty: 5,
        },
      ],
    },
  ],
};
