# TECSA Reporting • Vaca Muerta 🛢️🏗️

Plataforma de reportabilidad diaria de avance de obras y gasoductos en **Vaca Muerta (Añelo / Loma Campana, Neuquén, Argentina)** con transcripción y procesamiento de audio con **Gemini 3.5 Transcribe**, interfaz móvil táctil ultra-simple (% / Check), sincronización offline en campo y panel de control técnico de base.

---

## 🚀 Características Principales

### 📱 1. Vista Móvil de Campo (Capataz / Cuadrilla)
- **Modo Audio con Gemini 3.5 Transcribe:** Dictado por voz de avances con **Smart Transcription** (filtra muletillas y resuelve autocorrecciones) y **Custom Vocabulary** con más de 30 términos de la industria petrolera y de gasoductos (*zanjeo, tapada, DDH, biselado, holiday detector, tintas penetrantes*).
- **Catálogo Táctil Ultra-Simple (1 sola línea por tarea):**
  - **Opción `%`:** Botones de 1 toque directo (`25%`, `50%`, `75%`, `100%`).
  - **Opción `Check`:** Botón binario de inspección (`⚪ Pendiente` $\leftrightarrow$ `✅ Hecho ✓`).
- **Respaldo Offline con Dexie.js (IndexedDB):** Encola los partes sin señal en el yacimiento y sincroniza automáticamente al detectar 4G.
- **Captura de Fotos con Coordenadas GPS.**

### 🏢 2. Panel de Oficina Técnica (Base)
- **Bandeja de Validación de Partes Diarios:** Tarjetas de reporte colapsables estilo acordeón con detalle completo de tareas, audio transcripto y fotos de evidencia.
- **Flujo de Estados:** `PENDIENTE_REVISION` $\rightarrow$ `APROBADO` / `RECHAZADO`.
- **Curva Ponderada en Tiempo Real:** Impacto directo en el avance físico acumulado por etapa constructiva.
- **Exportación de Documento Oficial:** Modal preparado para imprimir o guardar en PDF con formato de Parte Diario de Obra y campos de firmas.

---

## 🛠️ Stack Tecnológico

- **Frontend / Fullstack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS.
- **IA Multimodal de Audio:** Google Gemini SDK (`@google/genai`), `gemini-3.5-transcribe` / `gemini-3.5-flash-lite`.
- **Base de Datos & ORM:** Neon Postgres (Serverless) + Drizzle ORM.
- **Almacenamiento Local Offline:** Dexie.js (IndexedDB).
- **Íconos & UI:** Lucide React, Glassmorphism, Tailwind 3.4.

---

## 📦 Instalación y Uso

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/chonik/TecsaReporting.git
   cd TecsaReporting
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno en `.env.local`:
   ```env
   GEMINI_API_KEY="tu_api_key_de_gemini"
   DATABASE_URL="postgresql://usuario:password@host/neondb?sslmode=require"
   ```

4. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   Abrir [http://localhost:3005](http://localhost:3005).
