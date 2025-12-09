<script setup lang="ts">
import type { IndexCardElement } from './types'

defineProps<{
  elements: IndexCardElement[]
}>()

const textClassMap: Record<'SmallText' | 'NormalText' | 'LargeText', string> = {
  SmallText: 'text-sm text-light',
  NormalText: 'text-base',
  LargeText: 'text-2xl font-bold'
}
</script>

<template>
  <div class="card shadow">
    <div class="card-body gap-3">
      <template
        v-for="(element, index) in elements"
        :key="index"
      >
        <div
          v-if="element.type === 'DivisionLine'"
          class="divider my-0"
        />
        <p
          v-else
          :class="textClassMap[element.type]"
        >
          {{ element.text }}
        </p>
      </template>
    </div>
  </div>
</template>
