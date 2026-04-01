<template>
  <div class="print-overlay" v-if="show">
    <div class="print-actions no-print">
      <button class="action-btn back-btn" @click="$emit('close')">⬅ Volver</button>
      <button class="action-btn print-action-btn" @click="handlePrint">🖨️ Guardar o Imprimir PDF</button>
    </div>

    <!-- PÁGINA 1: Cuenta de Cobro Formal -->
    <div class="print-page invoice-page">
      <p class="print-date">YUMBO {{ invoiceDate }}</p>
      
      <div class="text-center spacer-large">
        <h3 class="print-title">CUENTA DE COBRO #{{ invoiceNumber }}</h3>
        <h3 class="print-title">TRANSPORTES DORADOS DE COLOMBIA</h3>
        <p class="print-nit">NIT. 900.539.647-4</p>
      </div>

      <div class="text-center spacer-large">
        <h4 class="print-subtitle">DEBE A:</h4>
        <p class="print-body">WILSON CANTERO QUIÑONEZ</p>
        <p class="print-body">C.C. 6.549.197 DE YUMBO VALLE</p>
      </div>

      <div class="text-center spacer-large">
        <h4 class="print-subtitle">LA SUMA DE:</h4>
        <p class="print-body">{{ amountInWords }}</p>
        <p class="print-body">({{ formatCurrency(totalSum) }})</p>
        <p class="print-body description">
          POR CONCEPTO DE FLETES, SERVICIO DE TRANSPORTE DE COMBUSTIBLE DEL {{ tableTitle.replace('QUINCENA DEL', '') }}
        </p>
      </div>

      <div class="signature-section">
        <p class="print-body">Atentamente,</p>
        
        <!-- Firma real del usuario -->
        <div class="signature-image-container">
           <img src="/firma.png" alt="Firma Wilson Cantero" class="signature-img" />
        </div>

        <p class="print-body bold">WILSON CANTERO QUIÑONEZ</p>
        <p class="print-body bold">C.C. 6.549.197 DE YUMBO (VALLE)</p>
      </div>
    </div>

    <!-- PÁGINA 2: Anexo de Relación -->
    <div class="print-page annex-page page-break">
      <h3 class="print-title text-center spacer-medium">RELACION CUENTA DE COBRO</h3>
      <div class="annex-header">
        <p>DEL {{ tableTitle.replace('QUINCENA DEL', '') }}</p>
        <p>TRANSPORTADOR: TRANSPORTES CANTERO</p>
        <p>CUENTA DE COBRO: WILSON CANTERO</p>
        <p>VEHICULOS: TJX 078, SSK 877, ZNN 297, UFP 378</p>
      </div>

      <table class="print-table">
        <tbody>
          <tr>
            <th colspan="5" class="table-title">{{ tableTitle }}</th>
          </tr>
          <tr class="table-header-row">
            <td style="font-weight: bold;">FECHA</td>
            <td style="font-weight: bold;">CLIENTE</td>
            <td style="font-weight: bold;">GALONAJE</td>
            <td style="font-weight: bold;"># DE FACTURA</td>
            <td style="font-weight: bold;">TOTAL</td>
          </tr>
          <tr v-for="(row, index) in tableData" :key="index">
            <td>{{ row.fecha_salida }}</td>
            <td>{{ row.cliente }}</td>
            <td>{{ row.galonaje }}</td>
            <td>{{ row.numero_factura }}</td>
            <td>{{ row.total_calculado }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="tfoot-label">TOTAL</td>
            <td class="total-sum">{{ totalSum }}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- PÁGINAS ADICIONALES: Soporte de Guías Originales -->
    <div v-for="(file, index) in uploadedFiles" :key="index" class="print-page attachment-page page-break">
        <h3 class="print-title text-center">SOPORTE ORIGINAL: #{{ index + 1 }}</h3>
        <p class="text-center no-print" style="font-size: 0.8rem; color: #666;">Archivo: {{ file }}</p>
        <div class="attachment-container">
            <!-- Si es PDF intentamos embeberlo -->
            <template v-if="file.toLowerCase().endsWith('.pdf')">
                <embed :src="'/uploads/' + file" type="application/pdf" class="embedded-doc" />
                <p class="no-print" style="margin-top: 10px;">
                    <a :href="'/uploads/' + file" target="_blank">Abrir PDF en pestaña nueva si no carga</a>
                </p>
            </template>
            <!-- Si es imagen lo mostramos directamente -->
            <template v-else>
                <img :src="'/uploads/' + file" class="attachment-img" />
            </template>
        </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { numberToWords } from './numberToWords.js';

const props = defineProps({
  show: Boolean,
  tableData: Array,
  tableTitle: String,
  invoiceNumber: String,
  invoiceDate: String,
  uploadedFiles: {
    type: Array,
    default: () => []
  }
});

defineEmits(['close']);

const totalSum = computed(() => {
  return props.tableData.reduce((sum, item) => sum + Number(item.total_calculado || 0), 0);
});

const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(val);
};

const amountInWords = computed(() => {
    return numberToWords(totalSum.value);
});

const handlePrint = () => {
    window.print();
};
</script>

<style scoped>
.print-overlay {
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: #525252;
    z-index: 3000;
    overflow-y: auto;
    padding: 2rem 0;
    font-family: "Times New Roman", Times, serif;
}

.print-actions {
    position: fixed;
    top: 1rem;
    right: 2rem;
    display: flex;
    gap: 1rem;
}

.print-page {
    background: white;
    width: 21cm; /* A4 width */
    min-height: 29.7cm; /* A4 height */
    margin: 0 auto 2rem auto;
    padding: 3cm 2cm;
    box-shadow: 0 0 10px rgba(0,0,0,0.5);
    position: relative;
    color: black;
}

.text-center { text-align: center; }
.spacer-large { margin-top: 2cm; }
.spacer-medium { margin-bottom: 1cm; }

.print-date { font-weight: bold; font-size: 11pt; padding-top: 1cm; }
.print-title { font-weight: bold; font-size: 11pt; margin: 0.3cm 0; }
.print-nit { font-size: 11pt; margin-top: 0.2cm; }
.print-subtitle { font-weight: bold; font-size: 11pt; margin-bottom: 0.3cm; }
.print-body { font-size: 11pt; margin: 0.1cm 0; line-height: 1.5; }
.bold { font-weight: bold; }

.description {
    width: 80%;
    margin: 0.5cm auto 0 auto;
    text-transform: uppercase;
}

.signature-section {
    margin-top: 3cm;
    text-align: left;
    page-break-inside: avoid;
}

.signature-image-container {
    height: 1.2cm;
    max-width: 250px;
    margin: 0.1cm 0;
    position: relative;
    display: flex;
    align-items: flex-end;
}

.signature-image-container::after {
    content: "";
    display: block;
    width: 250px;
    height: 1px;
    background: black;
    position: absolute;
    bottom: 0;
    left: 0;
}

.signature-img {
    height: 150%; 
    max-width: 250px;
    width: auto;
    object-fit: contain;
    position: relative;
    bottom: -5px; 
}

.annex-page {
    page-break-inside: avoid; /* Intenta mantener toda la tabla en una sola hoja */
}

.annex-header {
    font-size: 10pt; /* Ligeramente más pequeña */
    text-transform: uppercase;
    line-height: 1.2;
    margin-bottom: 0.5cm; /* Reducido a la mitad */
}

.print-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt; /* Aún más pequeña para ganar espacio */
    text-align: center;
}

.print-table tr {
    page-break-inside: avoid; /* Evita que una sola fila se corte por la mitad */
}

.print-table th, .print-table td {
    border: 1px solid black;
    padding: 6px 4px; /* Un poco más de aire sin exagerar */
}

.print-table th.table-title {
    text-transform: uppercase;
    background: white; 
}

/* Print CSS */
@media print {
    @page { 
        margin: 1.5cm; 
        size: auto; 
    }
    
    body * {
        visibility: hidden;
    }
    
    .print-overlay {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: white;
        padding: 0;
        margin: 0;
        visibility: visible;
        overflow: visible;
    }

    .print-overlay * {
        visibility: visible;
    }

    .no-print {
        display: none !important;
    }

    .print-page {
        margin: 0 !important;
        box-shadow: none !important;
        width: 100% !important;
        min-height: 29.7cm !important;
        padding: 2cm !important; /* Volvemos a ponerle margen interno */
        border: none !important;
    }

    .invoice-page {
        page-break-after: always;
    }

    .page-break {
        display: block;
        page-break-before: always !important;
        margin-top: 0;
    }

    .annex-page {
        margin-top: 0 !important; 
        padding-top: 1cm !important;
    }

    .attachment-page {
        padding: 1cm !important;
        page-break-after: always;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .attachment-img, .embedded-doc {
        max-width: 100% !important;
        height: auto !important;
        max-height: 25cm !important;
    }
}

.attachment-container {
    width: 100%;
    margin-top: 1cm;
    display: flex;
    justify-content: center;
}

.attachment-img {
    max-width: 100%;
    max-height: 24cm;
    object-fit: contain;
    border: 1px solid #ddd;
}

.embedded-doc {
    width: 100%;
    height: 24cm;
    border: none;
}
</style>
