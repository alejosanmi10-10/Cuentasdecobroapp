<template>
  <div class="upload-section">
    <div 
      class="upload-zone" 
      @dragover.prevent="dragover = true" 
      @dragleave.prevent="dragover = false" 
      @drop.prevent="handleDrop"
      :class="{ 'dragging': dragover }"
    >
      <div v-if="loading" class="spinner-container fade-in">
        <div class="spinner"></div>
        <p class="loading-main">Analizando con Inteligencia Artificial...</p>
        <p class="loading-sub">Procesando archivo {{ processedCount }} de {{ totalCount }}</p>
        <p class="loading-warning">Por favor, no cierres esta ventana.</p>
      </div>

      <div v-else class="upload-content">
        <div class="upload-icon">
          <!-- Icono de múltiples documentos -->
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="12" y1="18" x2="12" y2="12"></line>
            <line x1="9" y1="15" x2="15" y2="15"></line>
          </svg>
        </div>
        <h3>Arrastra y suelta tus Guías de Transporte aquí</h3>
        <p class="subtitle">Soporta múltiples imágenes separadas o un PDF completo a la vez.</p>
        
        <label class="upload-btn">
          Seleccionar Archivos
          <input type="file" style="display: none;" @change="handleFileSelect" accept="image/jpeg, image/png, application/pdf" multiple />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const dragover = ref(false);
const loading = ref(false);
const processedCount = ref(0);
const totalCount = ref(0);

const emit = defineEmits(['upload-success']);

const processFile = async (file) => {
  const formData = new FormData();
  formData.append('invoice', file);
  
  try {
    const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : '';
    const response = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al procesar el documento con el servidor.');
    }
    
    const result = await response.json();
    // Emitir el éxito para que App.vue lo inyecte en la tabla en tiempo real
    emit('upload-success', result.data);
  } catch (error) {
    console.error("Fallo al procesar el archivo individual:", error);
    alert("❌ Fallo en la extracción: " + error.message);
  } finally {
    processedCount.value++;
  }
};

const processQueue = async (filesArray) => {
    if (!filesArray || filesArray.length === 0) return;

    loading.value = true;
    totalCount.value = filesArray.length;
    processedCount.value = 1;

    // Procesamos en serie para no golpear el Rate Limit (15 por minuto máximo)
    // de la capa gratuita de IA en la nube.
    for (let i = 0; i < filesArray.length; i++) {
        await processFile(filesArray[i]);
    }

    loading.value = false;
};

const handleDrop = (e) => {
  dragover.value = false;
  // Convertimos FileList a Array para poder procesarlo
  const files = Array.from(e.dataTransfer.files);
  if (files.length > 0) {
    processQueue(files);
  }
};

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) {
    processQueue(files);
  }
};
</script>

<style scoped>
/* Estilos extra para la carga múltiple */
.loading-main {
    font-weight: 700;
    font-size: 1.1rem;
    color: var(--text-dark);
}
.loading-sub {
    font-weight: 600;
    color: var(--accent);
    margin-top: -5px;
}
.loading-warning {
    font-size: 0.8rem;
    color: var(--text-light);
    font-style: italic;
}
</style>
