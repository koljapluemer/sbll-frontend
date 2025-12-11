import type { Component } from 'vue'
import type { GlossRef } from '@/entities/gloss/types'
import type { TaskType } from '../situation-practice/types'

export type SimulatedTask = {
  id: string
  taskType: TaskType
  taskData: unknown
  glossRef: GlossRef | null
  simulatedResult: boolean | undefined
  queueStateChange: string
  component: Component
}
