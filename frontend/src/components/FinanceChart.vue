<script setup lang="ts">
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
  PointElement,
  LineElement,
} from 'chart.js'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  Tooltip,
  PointElement,
  LineElement,
)

const props = defineProps<{
  type: 'doughnut' | 'bar' | 'line'
  title: string
  data: Record<string, unknown>
}>()
</script>

<template>
  <section class="card">
    <h3>{{ title }}</h3>
    <Doughnut v-if="props.type === 'doughnut'" :data="props.data as any" :options="{ responsive: true, plugins: { legend: { position: 'bottom' } } }" />
    <Bar v-else-if="props.type === 'bar'" :data="props.data as any" :options="{ responsive: true, plugins: { legend: { position: 'bottom' } } }" />
    <Line v-else :data="props.data as any" :options="{ responsive: true, plugins: { legend: { position: 'bottom' } } }" />
  </section>
</template>

<style scoped>
.card {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}
</style>
