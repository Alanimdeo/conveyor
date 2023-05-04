<template>
  <div class="main">
    <img src="/logo.svg" alt="logo" :class="['logo', headerStore.isDark ? 'white' : null]" />
    <ElRow class="statistics">
      <ElCol :span="8">
        <p>활성 폴더 수</p>
        <p>
          <span class="big">{{ watchDirectories.enabled }}</span>
          <span class="gray">/</span>
          <span class="gray">{{ watchDirectories.count }}</span>
        </p>
      </ElCol>
      <ElCol :span="8">
        <p>활성 감시 조건 수</p>
        <p>
          <span class="big">{{ watchConditions.enabled }}</span>
          <span class="gray">/</span>
          <span class="gray">{{ watchConditions.count }}</span>
        </p>
      </ElCol>
    </ElRow>
  </div>

  <div class="footer">
    <span class="small gray">Conveyor v{{ conveyorVersion }}, Conveyor DB v{{ dbVersion }}</span>
  </div>
</template>

<script setup lang="ts">
import { useHeaderStore } from "@/stores/header";

const headerStore = useHeaderStore();

const watchDirectories = await fetch("/api/watch-directory/count").then((res) => res.json());
const watchConditions = await fetch("/api/watch-condition/count").then((res) => res.json());

const conveyorVersion = __VERSION__;
const dbVersion = await fetch("/api/db-version").then((res) => res.text());
</script>

<style scoped>
.main {
  text-align: center;
}
.statistics {
  display: flex;
  justify-content: center;
  margin-top: 2em;
}
.logo {
  max-width: 240px;
}
.white {
  filter: invert(1);
}
.big {
  font-size: 3em;
}
.small {
  font-size: 0.8em;
}
.gray {
  color: #8d9095;
}
.footer {
  position: absolute;
  bottom: 1%;
  text-align: center;
}
</style>
