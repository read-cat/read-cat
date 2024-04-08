import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    name: 'home',
    path: '/home',
    component: () => import('../views/home/index.vue')
  },
  {
    name: 'bookshelf',
    path: '/bookshelf',
    component: () => import('../views/bookshelf/index.vue')
  },
  {
    name: 'bookstore',
    path: '/bookstore',
    component: () => import('../views/bookstore/index.vue')
  },
  {
    name: 'read',
    path: '/read',
    component: () => import('../views/read/index.vue')
  },
  {
    name: 'detail',
    path: '/detail',
    component: () => import('../views/detail/index.vue')
  },
  {
    name: 'history',
    path: '/history',
    component: () => import('../views/history/index.vue')
  },
  {
    name: 'search',
    path: '/search',
    component: () => import('../views/search/index.vue')
  },

];

export default createRouter({
  routes,
  history: createWebHashHistory()
});