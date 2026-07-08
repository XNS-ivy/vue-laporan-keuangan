<script setup lang="ts">
defineProps<{
  label: string
  value: string
  tone?: 'positive' | 'negative' | 'neutral'
}>()
</script>

<template>
  <article class="card stat-card" :class="tone">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
  </article>
</template>

<style scoped>
.card {
  background: var(--surface);
  border-radius: 18px;
  padding: 1rem;
  box-shadow: var(--shadow);
  border: 1px solid var(--border);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.stat-card span {
  color: var(--muted);
  font-size: 0.9rem;
}

.stat-card strong {
  font-size: 1.2rem;
  color: var(--text);
}

.positive {
  border-left: 4px solid var(--success);
}

.negative {
  border-left: 4px solid var(--danger);
}

.neutral {
  border-left: 4px solid var(--primary);
}
</style>
