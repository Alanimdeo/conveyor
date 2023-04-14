import { createRouter, createWebHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
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

export default router;
