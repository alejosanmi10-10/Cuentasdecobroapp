<template>
  <div class="results-container">
    <div class="table-wrapper">
      <div class="table-header-controls">
        <input 
          type="text" 
          :value="title" 
          @input="$emit('update:title', $event.target.value)" 
          class="title-input" 
          placeholder="Nombre de la Quincena..." 
        />
        <div class="header-actions">
          <button @click="$emit('save')" class="action-btn save-btn">Guardar</button>
          <button @click="$emit('open-print')" class="action-btn print-btn">📄 Generar Cuenta de Cobro</button>
          <button @click="$emit('export')" class="action-btn export-btn">Descargar a Excel</button>
          <button @click="$emit('clear')" class="action-btn clear-btn">Nueva Quincena</button>
        </div>
      </div>
      <!-- table remains exactly the same logic -->
      <table>
        <thead>
          <tr>
            <th>FECHA</th>
            <th>CLIENTE</th>
            <th>GALONAJE</th>
            <th># DE FACTURA</th>
            <th>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          <!-- Iteración sobre un array único controlado desde App.vue -->
          <tr v-for="(row, index) in data" :key="index" :class="{'new-row': row.isNew}">
            <td>{{ row.fecha_salida }}</td>
            
            <td><input v-model="row.cliente" class="editable-cell text-input" /></td>
            
            <td><input type="number" v-model="row.galonaje" class="editable-cell num-input" /></td>

            <td><input v-model="row.numero_factura" class="editable-cell num-input" /></td>

            <td class="focus-cell"><input type="number" v-model="row.total_calculado" class="editable-cell num-input total-input" /></td>
          </tr>
          <tr v-if="data.length === 0">
            <td colspan="5" class="empty-state">No hay facturas en esta quincena todavía. Arrastra tu documento arriba.</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="tfoot-label">TOTAL</td>
            <td class="total-sum num">{{ formatCurrency(totalSum) }}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  title: {
    type: String,
    default: 'NUEVA QUINCENA'
  }
});

defineEmits(['update:title', 'export', 'clear', 'save', 'open-print']);

const totalSum = computed(() => {
  return props.data.reduce((sum, item) => sum + Number(item.total_calculado || 0), 0);
});

const formatCurrency = (val) => {
    return val;
};
</script>
