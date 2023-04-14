<template>
  <ElHeader>
    <ElMenu :default-active="activeIndex" mode="horizontal" :ellipsis="false" router>
      <div class="logo">
        <!-- <img src="@/assets/logo.svg" alt="logo" width="auto" /> -->
        <p class="logo-title">Conveyor</p>
      </div>

      <ElMenuItem index="/">Home</ElMenuItem>
      <ElMenuItem index="/directory">Watch Directories</ElMenuItem>
      <ElMenuItem index="/logs">Logs</ElMenuItem>
      <div class="flex-grow" />

      <div class="after">
        <ElSwitch
          v-model="headerStore.isDark"
          size="large"
          inline-prompt
          :active-icon="Moon"
          :inactive-icon="Sunny"
          style="--el-switch-on-color: #303030; --el-switch-off-color: #8d9095"
        />
      </div>
    </ElMenu>
  </ElHeader>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Moon, Sunny } from "@element-plus/icons-vue";
import { useHeaderStore } from "@/stores/header";

const headerStore = useHeaderStore();

const activeIndex = computed(() => headerStore.activeIndex);
</script>

<style scoped>
.flex-grow {
  flex-grow: 1;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  /* font-size: 20px; */
  /* font-weight: 600; */
  /* color: #fff; */
}
.logo-title {
  /* font-size: 20px; */
  font-weight: 600;
  /* color: #fff; */
  margin: 0;
  margin-bottom: 0.4em;
}

.after {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
}
</style>
