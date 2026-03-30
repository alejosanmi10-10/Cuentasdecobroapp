<template>
  <div v-if="show" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-content history-panel">
      <div class="modal-header">
        <h2>🗂️ Historial de Quincenas</h2>
        <button class="close-btn" @click="$emit('close')">✖</button>
      </div>

      <div class="modal-body">
        <div v-if="loading" class="spinner"></div>
        <div v-else-if="quincenas.length === 0" class="empty-state">
          No tienes quincenas guardadas todavía.
        </div>
        <div v-else class="history-list">
            <div v-for="q in sortedQuincenas" :key="q.id" class="history-card">
               <div class="history-info">
                   <h3>{{ q.title || 'QUINCENA SIN TÍTULO' }}</h3>
                   <p>{{ q.data.length }} facturas registradas | Total: {{ formatCurrency(getTotal(q.data)) }}</p>
                   <small>Guardado el: {{ new Date(Number(q.id)).toLocaleString() }}</small>
               </div>
               <div class="history-actions">
                   <button class="btn load-btn" @click="loadQuincena(q)">Abrir / Cargar</button>
                   <button class="btn delete-btn" @click="deleteQuincena(q.id)">Eliminar</button>
               </div>
            </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'load-quincena']);

const quincenas = ref([]);
const loading = ref(false);

const loadHistory = async () => {
    loading.value = true;
    try {
        const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : '';
        const res = await fetch(`${API_BASE}/api/quincenas`);
        if(res.ok) {
            quincenas.value = await res.json();
        }
    } catch(err) {
        console.error("Error cargando historial", err);
    } finally {
        loading.value = false;
    }
};

watch(() => props.show, (newVal) => {
    if(newVal) {
        loadHistory();
    }
});

const sortedQuincenas = computed(() => {
    return [...quincenas.value].sort((a,b) => b.id - a.id);
});

const getNumberOrZero = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num;
}

const getTotal = (dataArr) => {
    if(!dataArr) return 0;
    return dataArr.reduce((sum, item) => sum + getNumberOrZero(item.total_calculado), 0);
};

const formatCurrency = (val) => {
    // Manteniendo la simplicidad visual como ResultsTable lo hacía
    return val;
};

const loadQuincena = (q) => {
    if(confirm('¿Estás seguro de que quieres cargar esta quincena? Cualquier cambio no guardado en la actual se perderá.')) {
        emit('load-quincena', q);
        emit('close');
    }
}

const deleteQuincena = async (id) => {
    if(!confirm('¿Estás seguro de que deseas eliminar permanentemente este registro?')) return;
    try {
        const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:3001' : '';
        await fetch(`${API_BASE}/api/quincenas/${id}`, { method: 'DELETE' });
        loadHistory();
    } catch(e) {
        alert("Error eliminando quincena");
    }
}
</script>

<style scoped>
.history-panel {
    max-width: 600px;
    width: 90%;
}
.history-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-top: 10px;
    max-height: 60vh;
    overflow-y: auto;
}
.history-card {
    background: #f9f9f9;
    border: 2px solid var(--accent);
    padding: 15px;
    border-radius: var(--radius);
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.history-info h3 {
    margin: 0 0 5px 0;
    font-size: 1.1rem;
}
.history-info p {
    margin: 0;
    color: var(--text-dark);
}
.history-info small {
    color: var(--text-light);
}
.history-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
.btn {
    padding: 8px 12px;
    border: none;
    border-radius: var(--radius);
    cursor: pointer;
    font-weight: 700;
    font-family: 'Space Grotesk', sans-serif;
    transition: all 0.2s;
    box-shadow: var(--shadow-small);
}
.load-btn {
    background: #3b82f6;
    color: white;
}
.load-btn:hover { background: #3b82f6; }
.delete-btn {
    background: #FF5A5F;
    color: white;
}
.delete-btn:hover { background: #e0484d; }
.empty-state {
    text-align: center;
    color: var(--text-light);
    padding: 30px;
}

/* ==================================
   RESPONSIVO / MOBILE (Smartphones)
   ================================== */
@media (max-width: 600px) {
    .history-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 15px;
        padding: 12px;
    }
    .history-actions {
        width: 100%;
        flex-direction: row;
    }
    .btn {
        flex: 1;
        text-align: center;
    }
}
</style>
