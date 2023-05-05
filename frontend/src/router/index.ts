import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { useHeaderStore } from "@/stores/header";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/login",
      name: "login",
      component: () => import("../views/Auth/LoginView.vue"),
    },
    {
      path: "/logout",
      name: "logout",
      component: () => import("../views/Auth/LogoutView.vue"),
    },
    {
      path: "/directory",
      name: "watch-directories",
      component: () => import("../views/WatchDirectories/IndexView.vue"),
    },
    {
      path: "/directory/:id",
      name: "watch-directory",
      component: () => import("../views/WatchDirectories/DetailView.vue"),
    },
    {
      path: "/preset",
      name: "presets",
      component: () => import("../views/Presets/IndexView.vue"),
    },
    {
      path: "/logs",
      name: "logs",
      component: () => import("../views/LogsView.vue"),
    },
  ],
});

router.beforeEach((to, _, next) => {
  const headerStore = useHeaderStore();
  headerStore.activeIndex = to.path.replace(/^(\/.*)\/.*$/, "$1");
  next();
});

export default router;
