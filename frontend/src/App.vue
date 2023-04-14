<script setup lang="ts">
import { RouterView } from "vue-router";
import Header from "@/components/Header.vue";
</script>

<template>
  <Header />

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
