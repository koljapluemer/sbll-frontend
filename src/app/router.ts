import { createRouter, createWebHistory } from 'vue-router'
import SituationsPage from '@/pages/situations/SituationsPage.vue'
import SelectLanguagePage from '@/pages/select-language/SelectLanguagePage.vue'
import SituationPracticePage from '@/pages/situation-practice/SituationPracticePage.vue'
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
      component: SituationPracticePage
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
