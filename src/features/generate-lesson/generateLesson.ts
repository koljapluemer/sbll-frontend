import { isCollection } from '@/entities/gloss/isCollection'
import type { Gloss } from '@/dumb/types'

export interface Lesson {
  finalChallengeGloss: Gloss | null
  exerciseGlosses: Gloss[]
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null
  const index = Math.floor(Math.random() * items.length)
  return items[index] ?? null
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = temp
  }
  return arr
}

export function generateLesson(
  glosses: Gloss[],
  understandingChallenges: Gloss[],
  expressionChallenges: Gloss[]
): Lesson {
  const glossByKey = new Map(glosses.map(gloss => [gloss.key, gloss]))
  const challengeOptions = Array.from(
    new Map(
      [...understandingChallenges, ...expressionChallenges]
        .filter(gloss => !isCollection(gloss.content))
        .map(gloss => [gloss.key, gloss])
    ).values()
  )

  const finalChallengeGloss = pickRandom(challengeOptions)
  if (!finalChallengeGloss) {
    return {
      finalChallengeGloss: null,
      exerciseGlosses: []
    }
  }

  const exerciseMap = new Map<string, Gloss>()
  const excludedKeys = new Set<string>([finalChallengeGloss.key, ...finalChallengeGloss.translations])

  const addGlossIfValid = (gloss: Gloss) => {
    if (isCollection(gloss.content)) return
    if (excludedKeys.has(gloss.key)) return
    if (!exerciseMap.has(gloss.key)) {
      exerciseMap.set(gloss.key, gloss)
    }
  }

  const addContainsRecursively = (key: string) => {
    const containedGloss = glossByKey.get(key)
    if (!containedGloss) return
    addGlossIfValid(containedGloss)
    containedGloss.contains.forEach(addContainsRecursively)
  }

  finalChallengeGloss.contains.forEach(addContainsRecursively)

  const translationReferencedKeys = new Set<string>()
  exerciseMap.forEach(gloss => {
    gloss.translations.forEach(key => translationReferencedKeys.add(key))
  })

  const translationReferenced = Array.from(translationReferencedKeys)
    .map(key => glossByKey.get(key))
    .filter((gloss): gloss is Gloss => Boolean(gloss))
    .filter(gloss =>
      !isCollection(gloss.content) &&
      !excludedKeys.has(gloss.key) &&
      !exerciseMap.has(gloss.key)
    )

  const containingReferenced = glosses.filter(gloss =>
    !isCollection(gloss.content) &&
    !excludedKeys.has(gloss.key) &&
    !exerciseMap.has(gloss.key) &&
    gloss.contains.some(key => exerciseMap.has(key))
  )

  const candidatePool = new Map<string, Gloss>()
  translationReferenced.forEach(gloss => candidatePool.set(gloss.key, gloss))
  containingReferenced.forEach(gloss => candidatePool.set(gloss.key, gloss))

  const candidateList = Array.from(candidatePool.values())

  while (exerciseMap.size < 16 && candidateList.length > 0) {
    const picked = pickRandom(candidateList)
    if (!picked) break
    addGlossIfValid(picked)
    const index = candidateList.findIndex(item => item.key === picked.key)
    if (index >= 0) {
      candidateList.splice(index, 1)
    }
  }

  const remainingPool = glosses.filter(gloss =>
    !isCollection(gloss.content) &&
    !excludedKeys.has(gloss.key) &&
    !exerciseMap.has(gloss.key)
  )

  while (exerciseMap.size < 16 && remainingPool.length > 0) {
    const picked = pickRandom(remainingPool)
    if (!picked) break
    addGlossIfValid(picked)
    const index = remainingPool.findIndex(item => item.key === picked.key)
    if (index >= 0) {
      remainingPool.splice(index, 1)
    }
  }

  const shuffledExercises = shuffle(Array.from(exerciseMap.values())).slice(0, 16)

  return {
    finalChallengeGloss,
    exerciseGlosses: shuffledExercises
  }
}
