import Vue from 'vue'
import Router from 'vue-router'
import TheMap from'@/pages/TheMap'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      component: TheMap
    }
  ]
})
