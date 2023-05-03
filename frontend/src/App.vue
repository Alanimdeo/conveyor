<script setup lang="ts">
import fetchInterceptor from "fetch-intercept";
import { RouterView, useRoute, useRouter } from "vue-router";
import Header from "@/components/Header.vue";

const route = useRoute();
const router = useRouter();

fetchInterceptor.register({
  request(url, config) {
    if (!config) {
      config = {};
    }
    if (!config.headers) {
      config.headers = {};
    }
    config.headers["Cookie"] = document.cookie;
    return [url, config];
  },
  response(response) {
    if (response.status === 401) {
      document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      router.push({ name: "login" });
    }
    return response;
  },
});
</script>

<template>
  <Suspense>
    <Header v-if="route.name !== 'login'" />
  </Suspense>

  <ElMain>
    <RouterView v-slot="{ Component }">
      <template v-if="Component">
        <Suspense>
          <component :is="Component" />
          <template #fallback> Loading... </template>
        </Suspense>
      </template>
    </RouterView>
  </ElMain>
</template>

<style>
:root {
  font-family: "Noto Sans KR", sans-serif;
}
body {
  margin: 0;
}
.el-alert__description {
  margin-top: 0 !important;
}
</style>
