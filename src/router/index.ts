import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import Layout from "/@/layout/layout.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/login"
  },
  {
    path: "/login",
    name: "login",
    meta: {
      title: "登录"
    },
    component: () => import("/@/views/login/login.vue")
  },
  {
    path: "/setting",
    name: "setting",
    meta: {
      title: "配置"
    },
    component: () => import("/@/views/setting/setting.vue")
  },
  {
    path: "/home",
    component: Layout,
    redirect: "/home/index",
    meta: {
      title: "首页"
    },
    children: [
      {
        path: "index",
        name: "home",
        component: () => import("/@/views/home/home.vue")
      }
    ]
  }
];
const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
