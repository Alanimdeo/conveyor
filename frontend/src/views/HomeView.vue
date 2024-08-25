<template>
  <div class="main">
    <img
      src="/logo.svg"
      alt="logo"
      :class="['logo', headerStore.isDark ? 'white' : null]"
    />
    <ElRow class="statistics">
      <ElCol :span="8">
        <p>활성 폴더 수</p>
        <p>
          <span class="huge">{{ watchDirectories.enabled }}</span>
          <span class="gray">/</span>
          <span class="gray">{{ watchDirectories.count }}</span>
        </p>
      </ElCol>
      <ElCol :span="8">
        <p>활성 감시 조건 수</p>
        <p>
          <span class="huge">{{ watchConditions.enabled }}</span>
          <span class="gray">/</span>
          <span class="gray">{{ watchConditions.count }}</span>
        </p>
      </ElCol>
    </ElRow>
  </div>

  <div class="footer small gray">
    <p>Conveyor v{{ conveyorVersion }}, Conveyor DB v{{ dbVersion }}&nbsp;</p>
    <span v-if="latestVersion === '0.0.0'">업데이트를 확인할 수 없습니다.</span>
    <span v-else-if="updateAvailable">
      업데이트 가능! 최신 버전:
      <a
        href="https://github.com/Alanimdeo/conveyor/releases/latest"
        target="_blank"
        class="gray"
      >
        {{ latestVersion }}
      </a>
    </span>
    <span v-else>
      최신 버전입니다.
      <a
        href="https://github.com/Alanimdeo/conveyor/releases/latest"
        target="_blank"
        class="gray"
        >변경 사항 보기</a
      >
    </span>
  </div>
</template>

<script setup lang="ts">
import semver from "semver";
import { useHeaderStore } from "@/stores/header";

const headerStore = useHeaderStore();

const watchDirectories = await fetch("/api/watch-directory/count").then((res) =>
  res.json()
);
const watchConditions = await fetch("/api/watch-condition/count").then((res) =>
  res.json()
);

const conveyorVersion = __VERSION__;
const dbVersion = await fetch("/api/db-version").then((res) => res.text());

const latestVersion = await fetch(
  "https://api.github.com/repos/Alanimdeo/conveyor/tags"
)
  .then(async (res) => {
    const tags: string[] = (await res.json()).map(
      (tag: { name: string }) => tag.name
    );
    tags.sort((a, b) => semver.compare(b, a));
    return tags[0];
  })
  .catch(() => "0.0.0");

const updateAvailable = semver.gt(latestVersion, conveyorVersion);
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
.footer {
  position: absolute;
  bottom: 1%;
  /* text-align: center; */
}
.footer > p {
  margin: 0;
}
</style>
