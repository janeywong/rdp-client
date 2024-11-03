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
  }
];
const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
