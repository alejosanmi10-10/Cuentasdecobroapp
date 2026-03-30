<template>
  <div class="app-container">
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
      />
    </main>

    <!-- Modal de Administración -->
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
</template>

<script setup>
import { ref } from 'vue';
import UploadZone from './UploadZone.vue';
import ResultsTable from './ResultsTable.vue';
import AdminPanel from './AdminPanel.vue';
import HistoryPanel from './HistoryPanel.vue';
import './styles.css';  // Import custom styles

// Estado centralizado e histórico
const tableData = ref([]);
const periodTitle = ref('QUINCENA DEL 1 AL 15 DE FEBRERO');
const duplicateMessage = ref('');
const showAdmin = ref(false);
const showHistory = ref(false);
const currentQuincenaId = ref(null);

// Cargar tarifas iniciales
const masterRates = ref(JSON.parse(localStorage.getItem('invoice_rates') || '[]'));

const handleRatesUpdated = (newRates) => {
    masterRates.value = newRates;
    // Opcional: Recalcular tabla actual si el usuario lo desea, 
    // pero por ahora solo se aplicará a nuevas subidas para no alterar lo ya editado manualmente.
};

const handleUploadSuccess = (extractedData) => {
    let duplicatedCount = 0;
    
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
            const rate = masterRates.value.find(r => clientName.toUpperCase().includes(r.client.toUpperCase()));
            
            let total = 0;
            if (rate) {
                total = (Number(newInvoice.galonaje) || 0) * rate.price;
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

        const payload = {
            id: currentQuincenaId.value,
            title: periodTitle.value,
            data: tableData.value
        };
        
        const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : '';
        const response = await fetch(`${API_BASE}/api/quincenas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            const result = await response.json();
            currentQuincenaId.value = result.quincena.id;
            alert('✅ Quincena guardada con éxito.');
        } else {
            alert('❌ Error al guardar en el servidor.');
        }
    } catch(err) {
        console.error("Save error", err);
        alert('❌ Imposible conectar al servidor para guardar.');
    }
};

const loadFortnight = (quincena) => {
    // Restaurar los datos a la tabla
    currentQuincenaId.value = quincena.id;
    periodTitle.value = quincena.title || 'QUINCENA RECUPERADA';
    tableData.value = quincena.data || [];
};
</script>
