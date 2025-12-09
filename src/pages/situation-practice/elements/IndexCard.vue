<script setup lang="ts">
import { computed } from 'vue'
import type { IndexCardRow } from './types'

const props = defineProps<{
  rows: IndexCardRow[]
  flipped?: boolean
  swiped?: boolean
}>()

const cardClasses = computed(() => [
  'card',
  'shadow',
  props.flipped && 'card-flipped',
  props.swiped && 'card-swiped'
])

const textClass = (row: IndexCardRow) => {
  if (row.type === 'divider') return ''

  if (row.size === 'small') return 'text-sm text-light'

  if (row.size === 'auto') {
    const length = row.text.length
    if (length < 3) return 'text-7xl font-bold'
    if (length < 20) return 'text-5xl font-bold'
    return 'text-2xl font-semibold'
  }

  return 'text-xl'
}
</script>

<template>
  <div :class="cardClasses">
    <div class="card-body gap-3">
      <template
        v-for="(row, index) in rows"
        :key="index"
      >
        <div
          v-if="row.type === 'divider'"
          class="divider my-0"
        />
        <p
          v-else
          :class="textClass(row)"
        >
          {{ row.text }}
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.card-flipped {
  transform-style: preserve-3d;
  animation: flipCard 0.4s ease;
}

@keyframes flipCard {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(0deg);
  }
}

.card-swiped {
  animation: swipeCard 0.35s ease forwards;
}

@keyframes swipeCard {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(60%);
    opacity: 0;
  }
}
</style>
