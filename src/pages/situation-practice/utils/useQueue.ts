import { ref } from 'vue'
import { pickRandom } from '@/dumb/random'
import type { GlossIndex, GlossRef } from '@/entities/gloss/types'
import type { StatefulGloss } from '../types'

type LearningState = 'blocked' | 'novel' | 'practicing' | 'done'

const doneStates: LearningState[] = ['practicing', 'done']

export const useQueue = (glossRefs: GlossRef[], repo: GlossIndex) => {
  const stateMap = ref<Record<GlossRef, LearningState>>({})
  const lastGlossRef = ref<GlossRef | null>(null)

  const isKnownGloss = (ref: GlossRef) => Boolean(repo[ref])

  const hasBlockingParts = (ref: GlossRef) => {
    const gloss = repo[ref]
    if (!gloss) return false

    return gloss.parts.some(partRef => {
      if (!isKnownGloss(partRef)) return false
      if (!glossRefs.includes(partRef)) return false

      const partState = stateMap.value[partRef] ?? 'novel'
      return !doneStates.includes(partState)
    })
  }

const unblockGlosses = () => {
  Object.entries(stateMap.value)
    .filter(([, state]) => state === 'blocked')
    .forEach(([candidateRef]) => {
      if (!hasBlockingParts(candidateRef)) {
        stateMap.value[candidateRef] = 'novel'
        console.info('[useQueue] Unblocked gloss', candidateRef)
      }
    })
}

  const initialize = () => {
    const initialStates: Record<GlossRef, LearningState> = {}

    glossRefs.forEach(ref => {
      if (!isKnownGloss(ref)) {
        console.warn('[useQueue] Unknown gloss ref in queue:', ref)
        initialStates[ref] = 'done'
        return
      }

      initialStates[ref] = hasBlockingParts(ref) ? 'blocked' : 'novel'
    })

    stateMap.value = initialStates
    lastGlossRef.value = null
    console.info('[useQueue] Initialized state map', stateMap.value)
  }

  const getDueGloss = (): StatefulGloss | undefined => {
    const candidates = Object.entries(stateMap.value)
      .filter(([, state]) => state === 'novel' || state === 'practicing')
      .map(([ref, state]) => ({ ref, state }))
      .filter(candidate => candidate.ref !== lastGlossRef.value)

    if (candidates.length === 0) return undefined

    const chosen = pickRandom(candidates)
    if (!chosen) return undefined

    lastGlossRef.value = chosen.ref
    console.info('[useQueue] getDueGloss picked', chosen.ref, 'state:', chosen.state)
    return chosen as StatefulGloss
  }

  const handleGlossScore = (glossRef: GlossRef, rememberedCorrectly?: boolean) => {
    const currentState = stateMap.value[glossRef]
    if (!currentState) return

    if (currentState === 'novel') {
      stateMap.value[glossRef] = 'practicing'
      console.info('[useQueue] State change', glossRef, 'novel -> practicing')
      unblockGlosses()
      return
    }

    if (currentState === 'practicing' && rememberedCorrectly) {
      stateMap.value[glossRef] = 'done'
      console.info('[useQueue] State change', glossRef, 'practicing -> done')
      return
    }

    console.info('[useQueue] State unchanged', glossRef, currentState, 'rememberedCorrectly:', rememberedCorrectly)
  }

  const setGlossInvalid = (glossRef: GlossRef) => {
    console.warn('[useQueue] Marking gloss invalid, skipping:', glossRef)
    stateMap.value[glossRef] = 'done'
    unblockGlosses()
  }

  initialize()

  return {
    getDueGloss,
    handleGlossScore,
    setGlossInvalid,
    reset: initialize,
    stateMap,
    lastGlossRef
  }
}
