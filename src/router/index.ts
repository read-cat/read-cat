import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/bookstore'
  },
  {
    name: 'bookshelf',
    path: '/bookshelf',
    meta: {
      title: '书架'
    },
    component: () => import('../views/bookshelf/index.vue')
  },
  {
    name: 'bookstore',
    path: '/bookstore',
    meta: {
      title: '书城'
    },
    component: () => import('../views/bookstore/index.vue')
  },
  {
    name: 'read',
    path: '/read',
    meta: {
      title: '阅读'
    },
    component: () => import('../views/read/index.vue')
  },
  {
    name: 'detail',
    path: '/detail',
    meta: {
      title: '详情'
    },
    component: () => import('../views/detail/index.vue')
  },
  {
    name: 'history',
    path: '/history',
    meta: {
      title: '历史记录'
    },
    component: () => import('../views/history/index.vue')
  },
  {
    name: 'search',
    path: '/search',
    meta: {
      title: '搜索'
    },
    component: () => import('../views/search/index.vue')
  },

];

export default createRouter({
  routes,
  history: createWebHashHistory()
});