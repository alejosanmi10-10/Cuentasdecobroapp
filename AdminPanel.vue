<template>
  <div v-if="show" class="admin-modal-overlay fade-in">
    <div class="admin-modal glassmorphism">
      <div class="modal-header">
        <h2>⚙️ Configuración de Tarifas</h2>
        <button @click="$emit('close')" class="close-btn">&times;</button>
      </div>
      
      <div class="modal-body">
        <p class="instr">Define el precio por galón para cada cliente. La aplicación multiplicará automáticamente (Galones x Precio) para calcular el Total.</p>
        
        <div class="tarifas-list">
          <div v-for="(rate, index) in rates" :key="index" class="rate-item">
            <input v-model="rate.client" placeholder="Nombre del Cliente (ej: TULUA)" class="rate-input" />
            <div class="price-input-group">
                <span class="currency-symbol">$</span>
                <input type="number" step="0.01" v-model="rate.price" placeholder="Precio x Galón" class="rate-input price-val" />
            </div>
            <button @click="removeRate(index)" class="remove-btn">🗑️</button>
          </div>
        </div>
        
        <button @click="addRate" class="add-rate-btn">+ Agregar Nuevo Cliente</button>
      </div>

      <div class="modal-footer">
        <button @click="saveAndClose" class="save-btn">Guardar Cambios</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  show: Boolean
});

const emit = defineEmits(['close', 'updated']);

const rates = ref([]);

// Cargar del localStorage al abrir
onMounted(() => {
    const saved = localStorage.getItem('invoice_rates');
    if (saved) {
        rates.ref = JSON.parse(saved);
        // Usamos un pequeño truco para asegurar reactividad
        rates.value = JSON.parse(saved);
    }
});

const addRate = () => {
    rates.value.push({ client: '', price: 0 });
};

const removeRate = (index) => {
    rates.value.splice(index, 1);
};

const saveAndClose = () => {
    // Limpiamos nombres para que coincidan con la IA (mayúsculas y sin espacios extra)
    const cleanedRates = rates.value.filter(r => r.client.trim() !== '').map(r => ({
        client: r.client.trim().toUpperCase(),
        price: Number(r.price) || 0
    }));

    localStorage.setItem('invoice_rates', JSON.stringify(cleanedRates));
    emit('updated', cleanedRates);
    emit('close');
};
</script>

<style scoped>
.admin-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 2000;
}

.admin-modal {
    background: white;
    width: 500px;
    max-width: 90%;
    border: 4px solid #1a1a1a;
    box-shadow: 10px 10px 0px #1a1a1a;
    padding: 2rem;
    position: relative;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
}

.close-btn {
    font-size: 2rem;
    background: none;
    border: none;
    cursor: pointer;
}

.instr {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 1.5rem;
}

.rate-item {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
}

.rate-input {
    padding: 10px;
    border: 2px solid #1a1a1a;
    font-family: inherit;
    font-weight: 600;
}

.price-input-group {
    display: flex;
    align-items: center;
    border: 2px solid #1a1a1a;
    padding-left: 10px;
}

.price-val {
    border: none !important;
    width: 100px;
}

.remove-btn {
    background: #fee2e2;
    border: 2px solid #ef4444;
    cursor: pointer;
    border-radius: 4px;
}

.add-rate-btn {
    width: 100%;
    margin-top: 10px;
    padding: 10px;
    background: #f0fdf4;
    border: 2px dashed #22c55e;
    color: #16a34a;
    font-weight: 700;
    cursor: pointer;
}

.save-btn {
    margin-top: 2rem;
    width: 100%;
    padding: 15px;
    background: #1a1a1a;
    color: white;
    font-weight: 800;
    border: none;
    cursor: pointer;
    text-transform: uppercase;
}

/* ==================================
   RESPONSIVO / MOBILE (Smartphones)
   ================================== */
@media (max-width: 600px) {
    .admin-modal {
        padding: 1rem;
    }
    .modal-header h2 {
        font-size: 1.3rem;
    }
    .rate-item {
        flex-direction: column;
        background: #f8fafc;
        padding: 10px;
        position: relative;
    }
    .rate-input {
        width: 100%;
    }
    .price-input-group {
        width: 100%;
    }
    .price-val {
        width: 100%;
    }
    .remove-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 5px 10px;
    }
}
</style>
