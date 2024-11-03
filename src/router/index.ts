import {createRouter, createWebHashHistory, RouteRecordRaw} from "vue-router";

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
];
const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
