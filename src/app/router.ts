import { createRouter, createWebHistory } from 'vue-router'
import SituationsPage from '@/pages/situations/SituationsPage.vue'
import SelectLanguagePage from '@/pages/select-language/SelectLanguagePage.vue'
import PracticeRouter from '@/pages/situation-practice/PracticeRouter.vue'
import { useLanguageStore } from '@/entities/language'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/situations'
    },
    {
      path: '/select-language',
      name: 'select-language',
      component: SelectLanguagePage
    },
    {
      path: '/situations',
      name: 'situations',
      component: SituationsPage
    },
    {
      path: '/situations/:situationId/practice',
      name: 'situation-practice',
      component: PracticeRouter
    },
    {
      path: '/situations/:situationId/debug',
      name: 'situation-debug',
      component: () => import('@/pages/situation-debug/SelectGoalPage.vue')
    },
    {
      path: '/situations/:situationId/debug/:mode/:goalIndex',
      name: 'situation-debug-sim',
      component: () => import('@/pages/situation-debug/SituationDebugPage.vue')
    }
  ]
})

router.beforeEach((to, _from, next) => {
  const languageStore = useLanguageStore()

  if (!languageStore.hasTargetLanguage && to.path !== '/select-language') {
    next('/select-language')
  } else if (languageStore.hasTargetLanguage && to.path === '/select-language') {
    next('/situations')
  } else {
    next()
  }
})

export default router
