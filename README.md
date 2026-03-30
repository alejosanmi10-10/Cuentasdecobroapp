# 🚛 Automatización de Cuentas de Cobro (IA OCR)

Aplicación web diseñada para la extracción automática de datos desde Guías de Transporte (PDF o Imágenes) hacia una tabla dinámica con exportación a Excel. 

Potenciada por **Google Gemini AI** para el reconocimiento de texto inteligente.

## 🌟 Características clave
- **Lectura Inteligente (OCR):** Procesa archivos de Guías de Transporte, ignorando facturas electrónicas irrelevantes.
- **Detección de Duplicados:** Bloquea facturas repetidas basándose en el número de factura.
- **Gestión por Quincenas:** Permite organizar, nombrar y limpiar tablas periódicamente.
- **Carga en Lote:** Soporta subir múltiples fotos independientes o PDFs consolidados.
- **Admin Panel:** Configuración de precios por galón personalizados por cliente.
- **Exportación Excel:** Genera archivos `.xlsx` nativos.

## 🛠️ Requisitos
- Node.js (v18 o superior)
- Una API Key de Google Gemini (puedes obtenerla en AI Studio de Google).

## 🚀 Cómo empezar

### 1. Clonar el repositorio
```bash
git clone <tu-url-de-github>
cd invoice-extractor
```

### 2. Configurar el Backend
```bash
cd backend
npm install
```
Crea un archivo `.env` dentro de la carpeta `backend/` y añade tu clave:
```env
GEMINI_API_KEY=tu_clave_aca
PORT=3001
```
Inicia el servidor:
```bash
npm start
```

### 3. Configurar el Frontend
Abre una nueva terminal:
```bash
cd frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5174`.

---
*Desarrollado con ❤️ para optimizar la gestión de transporte.*
