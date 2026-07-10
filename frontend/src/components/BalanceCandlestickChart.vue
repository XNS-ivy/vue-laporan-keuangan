<script setup lang="ts">
import { computed, ref } from 'vue'

interface Candlestick {
  month: string
  open: number
  close: number
  high: number
  low: number
}

const props = defineProps<{
  data: Candlestick[]
  title?: string
}>()

const hoveredIndex = ref<number | null>(null)
const tooltipX = ref(0)
const tooltipY = ref(0)

// SVG size dimensions
const svgWidth = 500
const svgHeight = 220
const paddingLeft = 60
const paddingRight = 20
const paddingTop = 20
const paddingBottom = 40

const chartWidth = svgWidth - paddingLeft - paddingRight
const chartHeight = svgHeight - paddingTop - paddingBottom

const hoveredItem = computed(() => {
  if (hoveredIndex.value === null) return null
  return props.data[hoveredIndex.value] || null
})

// Find min and max across all data points to set Y-axis scale
const yBounds = computed(() => {
  if (props.data.length === 0) return { min: 0, max: 1000000 }
  
  let min = Infinity
  let max = -Infinity
  
  props.data.forEach((item) => {
    if (item.low < min) min = item.low
    if (item.open < min) min = item.open
    if (item.close < min) min = item.close
    
    if (item.high > max) max = item.high
    if (item.open > max) max = item.open
    if (item.close > max) max = item.close
  })
  
  // Add 10% buffer to top and bottom
  const diff = max - min || 100000
  return {
    min: Math.max(0, min - diff * 0.1),
    max: max + diff * 0.1
  }
})

// Linear scale converter
const getY = (val: number) => {
  const { min, max } = yBounds.value
  if (max === min) return paddingTop + chartHeight / 2
  return paddingTop + chartHeight - ((val - min) / (max - min)) * chartHeight
}

// Generate ticks for Y axis (4 ticks)
const yTicks = computed(() => {
  const { min, max } = yBounds.value
  const count = 4
  const ticks: number[] = []
  for (let i = 0; i < count; i++) {
    ticks.push(min + (i * (max - min)) / (count - 1))
  }
  return ticks
})

// Format currency
const formatCurrency = (value: number) => {
  return 'Rp ' + Math.round(value).toLocaleString('id-ID')
}

// Hover handlers
const handleMouseEnter = (index: number, event: MouseEvent, container: HTMLElement | null) => {
  hoveredIndex.value = index
  if (container) {
    const rect = container.getBoundingClientRect()
    tooltipX.value = event.clientX - rect.left
    tooltipY.value = event.clientY - rect.top - 110
  }
}

const handleMouseMove = (event: MouseEvent, container: HTMLElement | null) => {
  if (container && hoveredIndex.value !== null) {
    const rect = container.getBoundingClientRect()
    tooltipX.value = event.clientX - rect.left
    tooltipY.value = event.clientY - rect.top - 110
  }
}

const handleMouseLeave = () => {
  hoveredIndex.value = null
}
</script>

<template>
  <section class="bg-surface border border-border rounded-2xl p-5 shadow-custom flex flex-col gap-4 relative" ref="containerRef">
    <div class="flex items-center justify-between border-b border-border pb-2">
      <h3 class="text-base font-bold text-text tracking-tight">{{ title || 'Candlestick Pergerakan Saldo' }}</h3>
      <span class="text-[10px] font-bold text-muted uppercase tracking-wider bg-surface-2 px-2.5 py-1 rounded-lg border border-border">
        Start/End vs Volatilitas
      </span>
    </div>

    <div v-if="data.length === 0" class="flex flex-col items-center justify-center py-16 text-xs text-muted font-semibold">
      Belum ada riwayat transaksi bulanan untuk menampilkan candlestick saldo.
    </div>

    <div v-else class="relative w-full overflow-hidden" @mouseleave="handleMouseLeave">
      <!-- Candlestick Chart SVG -->
      <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" class="w-full h-auto overflow-visible select-none">
        <!-- Horizontal Grid Lines -->
        <g>
          <line
            v-for="(tick, idx) in yTicks"
            :key="idx"
            :x1="paddingLeft"
            :y1="getY(tick)"
            :x2="svgWidth - paddingRight"
            :y2="getY(tick)"
            stroke="var(--border)"
            stroke-width="1"
            stroke-dasharray="4 4"
            opacity="0.5"
          />
          <!-- Y-Axis Labels -->
          <text
            v-for="(tick, idx) in yTicks"
            :key="`lbl-${idx}`"
            :x="paddingLeft - 10"
            :y="getY(tick) + 4"
            text-anchor="end"
            class="text-[9px] font-semibold fill-muted"
          >
            {{ Math.round(tick) >= 1000000 ? (tick / 1000000).toFixed(1) + 'M' : Math.round(tick) >= 1000 ? (tick / 1000).toFixed(0) + 'K' : Math.round(tick) }}
          </text>
        </g>

        <!-- Candlesticks Columns -->
        <g>
          <g
            v-for="(item, idx) in data"
            :key="idx"
            class="cursor-pointer group"
            @mouseenter="($event) => handleMouseEnter(idx, $event, $el.parentElement)"
            @mousemove="($event) => handleMouseMove($event, $el.parentElement)"
          >
            <!-- X axis center of column -->
            <path
              v-if="hoveredIndex === idx"
              :d="`M ${(idx + 0.5) * (chartWidth / data.length) + paddingLeft} ${paddingTop} L ${(idx + 0.5) * (chartWidth / data.length) + paddingLeft} ${svgHeight - paddingBottom}`"
              stroke="var(--primary)"
              stroke-width="1.5"
              stroke-dasharray="3 3"
              opacity="0.3"
            />

            <!-- Volatility Wick (High to Low) -->
            <line
              :x1="(idx + 0.5) * (chartWidth / data.length) + paddingLeft"
              :y1="getY(item.high)"
              :x2="(idx + 0.5) * (chartWidth / data.length) + paddingLeft"
              :y2="getY(item.low)"
              :stroke="item.close >= item.open ? 'var(--success)' : 'var(--danger)'"
              stroke-width="2.5"
              stroke-linecap="round"
              opacity="0.75"
            />

            <!-- Candlestick Body (Open to Close) -->
            <rect
              :x="(idx + 0.5) * (chartWidth / data.length) + paddingLeft - 12"
              :y="Math.min(getY(item.open), getY(item.close))"
              width="24"
              :height="Math.max(3, Math.abs(getY(item.open) - getY(item.close)))"
              :fill="item.close >= item.open ? 'var(--success)' : 'var(--danger)'"
              :stroke="item.close >= item.open ? 'var(--success)' : 'var(--danger)'"
              stroke-width="1.5"
              rx="4"
              opacity="0.88"
              class="transition-all duration-300 group-hover:scale-y-105 group-hover:opacity-100"
              style="transform-origin: center;"
            />

            <!-- Month Label -->
            <text
              :x="(idx + 0.5) * (chartWidth / data.length) + paddingLeft"
              :y="svgHeight - paddingBottom + 18"
              text-anchor="middle"
              class="text-[10px] font-bold fill-muted uppercase tracking-wider"
            >
              {{ item.month.slice(5) }}/{{ item.month.slice(2, 4) }}
            </text>
          </g>
        </g>
      </svg>

      <!-- Hover Tooltip -->
      <transition name="fade">
        <div
          v-if="hoveredItem !== null"
          class="absolute z-50 bg-slate-950/95 backdrop-blur-md border border-white/10 rounded-xl p-3.5 shadow-2xl text-[11px] font-semibold text-white pointer-events-none flex flex-col gap-1 w-48 transition-all duration-75"
          :style="{
            left: `${tooltipX}px`,
            top: `${tooltipY}px`
          }"
        >
          <div class="text-[10px] font-bold text-slate-400 border-b border-white/10 pb-1 mb-1 uppercase tracking-wider">
            Bulan: {{ hoveredItem.month }}
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-slate-400">Tinggi (High):</span>
            <span class="text-emerald-400 font-bold">{{ formatCurrency(hoveredItem.high) }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-slate-400">Rendah (Low):</span>
            <span class="text-rose-400 font-bold">{{ formatCurrency(hoveredItem.low) }}</span>
          </div>
          <div class="flex justify-between gap-4 border-t border-white/5 pt-1 mt-1">
            <span class="text-slate-400">Buka (Open):</span>
            <span>{{ formatCurrency(hoveredItem.open) }}</span>
          </div>
          <div class="flex justify-between gap-4">
            <span class="text-slate-400">Tutup (Close):</span>
            <span :class="hoveredItem.close >= hoveredItem.open ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'">
              {{ formatCurrency(hoveredItem.close) }}
            </span>
          </div>
        </div>
      </transition>
    </div>
  </section>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
