import { createRouter, createWebHistory } from 'vue-router'
import SituationsPage from '@/pages/situations/SituationsPage.vue'
import SelectNativeLanguagePage from '@/pages/select-native-language/SelectNativeLanguagePage.vue'
import SelectTargetLanguagePage from '@/pages/select-target-language/SelectTargetLanguagePage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/learn'
    },
    {
      path: '/learn',
      name: 'select-native-language',
      component: SelectNativeLanguagePage
    },
    {
      path: '/learn/:nativeIso',
      name: 'select-target-language',
      component: SelectTargetLanguagePage
    },
    {
      path: '/learn/:nativeIso/:targetIso',
      name: 'situations',
      component: SituationsPage
    },
    {
      path: '/learn/:nativeIso/:targetIso/situations/:situationId/practice',
      name: 'situation-practice',
      component: () => import('@/pages/situation-practice/SituationPracticePage.vue')
    },
    {
      path: '/learn/:nativeIso/:targetIso/situations/:situationId/debug',
      name: 'situation-debug',
      component: () => import('@/pages/situation-debug/SelectGoalPage.vue')
    },
    {
      path: '/learn/:nativeIso/:targetIso/situations/:situationId/debug/:mode/:goalIndex',
      name: 'situation-debug-sim',
      component: () => import('@/pages/situation-debug/SituationDebugPage.vue')
    }
  ]
})

export default router
