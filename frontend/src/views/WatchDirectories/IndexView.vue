<template>
  <div class="container">
    <div class="end">
      <ElButton type="primary" :icon="Plus" @click="openCreateDialog()">추가</ElButton>
    </div>

    <ElEmpty v-if="watchDirectories.length === 0" description="폴더가 없습니다. 추가 버튼을 눌러 추가해 보세요!" />

    <ElCard v-else v-for="directory in watchDirectories" :key="directory.id">
      <template #header>
        <div class="card-header">
          <div>
            <span class="folder-name">
              <span v-if="directory.name">
                {{ directory.name }}
              </span>
              <span v-else>
                <span>이름 없는 폴더</span>
                <span class="folder-id"> #{{ directory.id }} </span>
              </span>
            </span>
            <ElTag v-if="directory.enabled" type="success">사용 중</ElTag>
            <ElTag v-else type="danger">비활성화</ElTag>
          </div>
          <div>
            <ElButton link type="primary" :icon="Edit" @click="router.push(`/directory/${directory.id}`)">
              편집
            </ElButton>
            <ElButton link type="danger" :icon="Delete" @click="openRemoveDialog(directory.id)">삭제</ElButton>
          </div>
        </div>
      </template>

      <span>폴더 경로: </span>
      <span>{{ directory.path }}</span>
    </ElCard>
  </div>

  <RemoveDialog v-model="removeDialog" title="폴더 삭제" :name="selectedDirectoryName" @confirm="removeDirectory()">
    <template #message>
      <span> 폴더를 삭제하시겠습니까? 이 작업은 해당 폴더 및 모든 하위 조건들을 삭제하며 되돌릴 수 없습니다!</span>
    </template>
  </RemoveDialog>

  <WatchDirectoryDialog
    v-model="createDialog"
    :loading="creatingDirectory"
    :options="createDirectoryOptions"
    @create="createDirectory"
  >
    <template #before>
      <div class="mb end">
        <ElButton type="success" :icon="Files" @click="presetDialog = true"> 프리셋 </ElButton>
      </div>
    </template>
  </WatchDirectoryDialog>

  <PresetDialog v-model="presetDialog" type="watch-directory" @select="selectPreset" />
</template>

<script setup lang="ts">
import { Delete, Edit, Plus, Files } from "@element-plus/icons-vue";
import type { WatchDirectory, WatchDirectoryPreset } from "@conveyor/types";
import { useRouter } from "vue-router";
import { computed, h, ref } from "vue";
import type { Ref } from "vue";
import { ElMessage } from "element-plus";
import WatchDirectoryDialog from "@/components/WatchDirectoryDialog.vue";
import RemoveDialog from "@/components/RemoveDialog.vue";
import PresetDialog from "@/components/PresetDialog.vue";

const router = useRouter();
const currentDirectoryId = ref(0);
const createDirectoryOptions: Ref<Omit<WatchDirectory, "id">> = ref({
  name: "",
  enabled: true,
  path: "",
  recursive: true,
  usePolling: false,
  interval: 5000,
  ignoreDotFiles: true,
});

const createDialog = ref(false);
const creatingDirectory = ref(false);

function openCreateDialog() {
  createDirectoryOptions.value.name = "";
  createDirectoryOptions.value.enabled = true;
  createDirectoryOptions.value.path = "";
  createDirectoryOptions.value.recursive = true;
  createDirectoryOptions.value.usePolling = false;
  createDirectoryOptions.value.interval = 5000;
  createDirectoryOptions.value.ignoreDotFiles = true;

  createDialog.value = true;
}

async function createDirectory() {
  creatingDirectory.value = true;
  const response = await fetch("/api/watch-directory", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createDirectoryOptions.value),
  }).then(async (res) => {
    try {
      return await res.json();
    } catch (e) {
      return { error: "서버에서 응답을 받지 못했습니다." };
    }
  });

  if (response.success) {
    ElMessage({
      type: "success",
      message: "폴더를 생성했습니다.",
    });
    createDialog.value = false;
    await refreshWatchDirectories();
  } else {
    ElMessage({
      type: "error",
      message: h("div", null, [h("p", null, "폴더를 생성하지 못했습니다."), h("p", null, response.error)]),
    });
  }

  creatingDirectory.value = false;
}

const removeDialog = ref(false);
function openRemoveDialog(id: number) {
  currentDirectoryId.value = id;
  removeDialog.value = true;
}

const selectedDirectoryName = computed(
  () =>
    watchDirectories.value.find((directory) => directory.id === currentDirectoryId.value)?.name ||
    `이름 없는 폴더 #${currentDirectoryId.value}`
);

const removingDirectory = ref(false);
async function removeDirectory() {
  removingDirectory.value = true;
  const response = await fetch("/api/watch-directory/" + currentDirectoryId.value, {
    method: "DELETE",
  }).then(async (res) => {
    try {
      return await res.json();
    } catch (e) {
      return { error: "서버에서 응답을 받지 못했습니다." };
    }
  });

  if (response.error) {
    console.error(response.error);
    ElMessage.error("오류가 발생하여 폴더를 삭제하지 못했습니다.");
    removingDirectory.value = false;
    return;
  }

  ElMessage.success("폴더를 삭제했습니다.");
  removeDialog.value = false;
  removingDirectory.value = false;
  await refreshWatchDirectories();
}

const watchDirectories: Ref<WatchDirectory[]> = ref([]);
async function refreshWatchDirectories() {
  const response = await fetch("/api/watch-directory").then(async (res) => {
    try {
      return await res.json();
    } catch (e) {
      return { error: "서버에서 응답을 받지 못했습니다." };
    }
  });
  if (response.error) {
    ElMessage.error("폴더 목록을 불러오지 못했습니다.");
    return;
  }
  watchDirectories.value = response;
}

const presetDialog = ref(false);
function selectPreset(preset: WatchDirectoryPreset) {
  createDirectoryOptions.value = Object.assign({}, preset);
}

await refreshWatchDirectories();
</script>

<style scoped>
.folder-name {
  margin-right: 0.5rem;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.alert {
  display: inline-block;
}
.folder-id {
  font-size: 1rem;
  font-weight: 300;
  color: #777;
}
</style>
