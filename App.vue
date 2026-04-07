<template>
  <div class="app-container">
    <div class="no-print-area">
      <header class="app-header">
        <div class="header-top">
          <h1>Automatización de Cuentas de Cobro</h1>
          <div class="header-buttons">
              <button @click="showHistory = true" class="history-btn">🗂️ Historial</button>
              <button @click="showAdmin = true" class="config-btn">⚙️ Configurar Precios</button>
          </div>
        </div>
        <p>Sube las fotos de tus Guías de Transporte. La Inteligencia Artificial extraerá los datos automáticamente.</p>
      </header>
      
      <!-- Alerta visual moderna para duplicados bloqueados -->
      <div v-if="duplicateMessage" class="duplicate-alert fade-in">
        <span class="icon">⚠️</span>
        {{ duplicateMessage }}
      </div>

      <main class="main-content">
        <UploadZone @upload-success="handleUploadSuccess" />
        <ResultsTable 
          :data="tableData" 
          v-model:title="periodTitle"
          @export="exportToCSV"
          @clear="clearFortnight"
          @save="saveFortnight"
          @open-print="handleOpenPrint"
        />
      </main>

      <!-- Panel de Administración -->
      <AdminPanel 
        :show="showAdmin" 
        @close="showAdmin = false" 
        @updated="handleRatesUpdated"
      />

      <!-- Historial -->
      <HistoryPanel 
        :show="showHistory" 
        @close="showHistory = false" 
        @load-quincena="loadFortnight"
      />
    </div>

    <PrintDocument 
      :show="showPrint" 
      :tableData="tableData" 
      :tableTitle="periodTitle"
      :invoiceNumber="printInvoiceNumber"
      :invoiceDate="printInvoiceDate"
      :uploadedFiles="uploadedFiles"
      @close="showPrint = false" 
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import UploadZone from './UploadZone.vue';
import ResultsTable from './ResultsTable.vue';
import AdminPanel from './AdminPanel.vue';
import HistoryPanel from './HistoryPanel.vue';
import PrintDocument from './PrintDocument.vue';
import './styles.css';  // Import custom styles

// Estado centralizado e histórico
const tableData = ref([]);
const periodTitle = ref('QUINCENA DEL 1 AL 15 DE FEBRERO');
const duplicateMessage = ref('');
const showAdmin = ref(false);
const showHistory = ref(false);
const showPrint = ref(false);
const printInvoiceDate = ref('');
const printInvoiceNumber = ref('');
const currentQuincenaId = ref(null);
const uploadedFiles = ref([]); // Lista de archivos para soporte visual en la impresión

// Tarifas por defecto para inicialización
const defaultRates = [
  { client: "CARVAJAL", price: 525600, discount: 0, isFixed: true },
  { client: "ETERNIT", price: 176928, discount: 0, isFixed: true },
  { client: "SERVICIOS INDUSTRIALES", price: 314748, discount: 0, isFixed: true },
  { client: "BRASILIA", price: 80, discount: 10, isFixed: false },
  { client: "BUCANERO", price: 392400, discount: 0, isFixed: true },
  { client: "LIMONES", price: 314343, discount: 0, isFixed: true },
  { client: "TULUA", price: 160, discount: 10, isFixed: false },
  { client: "IGLESIA CRISTIANA", price: 355811, discount: 0, isFixed: true },
  { client: "POLIMIX", price: 366148, discount: 0, isFixed: true },
  { client: "PWR SERVICE", price: 439, discount: 10, isFixed: false },
  { client: "ELAWA", price: 327898, discount: 0, isFixed: true }
];

// Cargar tarifas iniciales (desde localStorage o usando las de por defecto)
const getInitialRates = () => {
    const saved = localStorage.getItem('invoice_rates');
    if (saved && saved !== '[]') {
        return JSON.parse(saved);
    }
    return [...defaultRates];
};

const rates = ref(getInitialRates());

const handleRatesUpdated = (newRates) => {
    rates.value = newRates;
    recalculatePrices(); // ¡ESTO ES NUEVO! Actualiza los precios de lo que ya tienes cargado
};

const recalculatePrices = () => {
    tableData.value = tableData.value.map(row => {
        const clientName = row.client || row.cliente || '';
        const sortedRates = [...rates.value].sort((a, b) => b.client.length - a.client.length);
        const rate = sortedRates.find(r => clientName.toUpperCase().includes(r.client.toUpperCase()));
        
        let total = row.total_calculado;
        if (rate) {
            if (rate.isFixed) {
                total = rate.price;
            } else {
                total = (Number(row.galonaje) || 0) * rate.price;
            }
            
            if (rate.discount) {
                total -= total * (rate.discount / 100);
            }
        }
        return { ...row, total_calculado: Math.round(total) };
    });
};

const handleOpenPrint = () => {
    if (tableData.value.length === 0) {
        alert('Agrega datos a la tabla primero para generar la cuenta.');
        return;
    }
    
    // 1. Número y Fecha unificados por coma para evitar el bloqueo Anti-Spam del navegador
    const today = new Date();
    const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    const defaultDate = `${today.getDate()} DE ${months[today.getMonth()]} DEL ${today.getFullYear()}`;

    const input = prompt(
        'GENERACIÓN DE CUENTA DE COBRO\n\n' +
        'Ingresa el Número y (opcional) la Fecha separados por una COMA (,).\n' +
        'Si solo pones el número, usaremos la fecha de hoy.\n\n' +
        `Ejemplo: 108, ${defaultDate}`,
        '108'
    );

    if (input === null) return; // Se canceló

    const parts = input.split(',');
    printInvoiceNumber.value = parts[0].trim();
    
    // Si escribió la fecha después de la coma, usarla. De lo contrario, usar automática.
    if (parts.length > 1 && parts[1].trim() !== '') {
        printInvoiceDate.value = parts[1].trim().toUpperCase();
    } else {
        printInvoiceDate.value = defaultDate;
    }

    showPrint.value = true;
    console.log("Print mode activated", {
        invoiceNumber: printInvoiceNumber.value,
        invoiceDate: printInvoiceDate.value,
        dataLength: tableData.value.length
    });
};

const handleUploadSuccess = (payload) => {
    let duplicatedCount = 0;
    
    // El payload ahora es un objeto { success, data, filename }
    const extractedData = payload.data;
    const filename = payload.filename;
    
    // Guardar el archivo para la impresión si no está ya en la lista
    if (filename && !uploadedFiles.value.includes(filename)) {
        uploadedFiles.value.push(filename);
    }

    // Soporte para Array (Subida de un PDF entero)
    const invoices = Array.isArray(extractedData) ? extractedData : [extractedData];

    invoices.forEach(newInvoice => {
        // Buscamos si el # de factura ya existe exacto en esta quincena
        const isDuplicate = tableData.value.find(item => item.numero_factura === newInvoice.numero_factura);
        
        if (isDuplicate) {
            duplicatedCount++;
        } else {
            // --- CÁLCULO AUTOMÁTICO DE VALORES ---
            const clientName = newInvoice.client || newInvoice.cliente || '';
            const sortedRates = [...masterRates.value].sort((a, b) => b.client.length - a.client.length);
            const rate = sortedRates.find(r => clientName.toUpperCase().includes(r.client.toUpperCase()));
            
            let total = 0;
            if (rate) {
                if (rate.isFixed) {
                    total = rate.price;
                } else {
                    total = (Number(newInvoice.galonaje) || 0) * rate.price;
                }
                
                if (rate.discount) {
                    total -= total * (rate.discount / 100);
                }
            }

            // Bandera 'isNew' para la animación verde de CSS en ResultsTable
            tableData.value.push({ 
                ...newInvoice, 
                total_calculado: total || newInvoice.total_calculado || '',
                isNew: true 
            });
        }
    });

    if (duplicatedCount > 0) {
        duplicateMessage.value = `Protección Anti-Duplicados: Se descartaron ${duplicatedCount} cuentas de cobro porque ya se encontraban registradas en esta quincena.`;
        setTimeout(() => duplicateMessage.value = '', 6000);
    } else {
        duplicateMessage.value = '';
    }
};

import * as XLSX from 'xlsx';

const exportToCSV = () => { // Se mantiene el nombre por compatibilidad con el template
    if (tableData.value.length === 0) {
        alert('No hay facturas agregadas a esta quincena para exportar.');
        return;
    }
    
    // Preparar datos en un formato legible para la librería de Excel
    const exportData = tableData.value.map(item => ({
        'FECHA': item.fecha_salida,
        'CLIENTE': item.cliente,
        'GALONAJE': Number(item.galonaje) || item.galonaje,
        '# DE FACTURA': item.numero_factura,
        'TOTAL': Number(item.total_calculado) || ''
    }));
    
    // Construir la estructura completa de Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Quincena Actual");
    
    let filename = periodTitle.value ? periodTitle.value.trim().replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_').toLowerCase() : 'exportacion';
    if (!filename) filename = 'exportacion_quincena';
    
    const finalName = `${filename}.xlsx`;
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Uso agresivo de 'showSaveFilePicker' nativo para forzar a la Mac a abrir un diálogo "Guardar Como", ignorando hacks del DOM
    if (window.showSaveFilePicker) {
        window.showSaveFilePicker({
            suggestedName: finalName,
            types: [{
                description: 'Excel Document',
                accept: {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']}
            }]
        }).then(async (handle) => {
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            console.log("Archivo Excel guardado nativamente.");
        }).catch(err => {
            if (err.name !== 'AbortError') { // Si no fue que el usuario canceló
                 fallbackDownload(blob, finalName);
            }
        });
    } else {
        fallbackDownload(blob, finalName);
    }
};

const fallbackDownload = (blob, finalName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, 10000);
};

const clearFortnight = () => {
    if (confirm('¿Estás seguro que deseas limpiar la tabla para empezar una "Nueva Quincena"? \n\nAsegúrate de haber presionado "Guardar" primero si no quieres perder estos datos.')) {
        tableData.value = [];
        uploadedFiles.value = []; // Limpiar también los archivos de soporte
        periodTitle.value = 'NUEVA QUINCENA';
        currentQuincenaId.value = null; // Reset ID for new record
    }
};

const saveFortnight = async () => {
    if (tableData.value.length === 0) {
        alert("No hay facturas agregadas a esta quincena para guardar.");
        return;
    }
    
    try {
        const newTitle = prompt('Nombre para guardar esta quincena:', periodTitle.value);
        if (newTitle === null) return; // canceló
        if (newTitle.trim() !== '') {
            periodTitle.value = newTitle.toUpperCase();
        }

        if (!currentQuincenaId.value) {
            currentQuincenaId.value = Date.now().toString();
        }

        const quincenaData = {
            id: currentQuincenaId.value,
            title: periodTitle.value,
            data: tableData.value,
            files: uploadedFiles.value
        };

        // --- PRIORIDAD 1: GUARDAR EN LA NUBE (MONGODB) ---
        const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : '';
        const response = await fetch(`${API_BASE}/api/quincenas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quincenaData)
        });
        
        if (response.ok) {
            const result = await response.json();
            currentQuincenaId.value = result.quincena.id;
            alert('✅ Quincena guardada en la NUBE con éxito. ¡Ya puedes verla en tu celular!');
        } else {
            throw new Error("API Failure");
        }

        // --- RESPALDO: ACTUALIZAR TAMBIÉN LOCALSTORAGE ---
        const savedData = localStorage.getItem('invoice_quincenas');
        let quincenas = savedData ? JSON.parse(savedData) : [];
        const index = quincenas.findIndex(q => q.id === quincenaData.id);
        if (index !== -1) quincenas[index] = quincenaData;
        else quincenas.push(quincenaData);
        localStorage.setItem('invoice_quincenas', JSON.stringify(quincenas));

    } catch(err) {
        console.error("Save error", err);
        alert(`❌ Error al intentar guardar: ${err.message || "Fallo desconocido"}. Revisa la consola para más detalles.`);
        // Fallback total a local si la nube falla
        saveLocalOnly();
    }
};

const saveLocalOnly = () => {
    const quincenaData = {
        id: currentQuincenaId.value || Date.now().toString(),
        title: periodTitle.value,
        data: tableData.value,
        files: uploadedFiles.value
    };
    const savedData = localStorage.getItem('invoice_quincenas');
    let quincenas = savedData ? JSON.parse(savedData) : [];
    const index = quincenas.findIndex(q => q.id === quincenaData.id);
    if (index !== -1) quincenas[index] = quincenaData;
    else quincenas.push(quincenaData);
    localStorage.setItem('invoice_quincenas', JSON.stringify(quincenas));
    alert('⚠️ No se pudo conectar con la nube, pero se guardó LOCALMENTE en este dispositivo.');
};

const loadFortnight = (quincena) => {
    // Restaurar los datos a la tabla
    currentQuincenaId.value = quincena.id;
    periodTitle.value = quincena.title || 'QUINCENA RECUPERADA';
    tableData.value = quincena.data || [];
    uploadedFiles.value = quincena.files || []; // Restaurar también los archivos de soporte
};
</script>
