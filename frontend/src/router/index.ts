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
      component: () => import("../views/LoginView.vue"),
    },
    {
      path: "/logout",
      name: "logout",
      component: () => import("../views/LogoutView.vue"),
    },
    {
      path: "/directory",
      name: "watch-directories",
      component: () => import("../views/WatchDirectoriesView.vue"),
    },
    {
      path: "/directory/:id",
      name: "watch-directory",
      component: () => import("../views/WatchDirectoryDetailView.vue"),
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
  headerStore.activeIndex = to.path;
  next();
});

export default router;
