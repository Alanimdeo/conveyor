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
            <span class="folder-id">폴더 #{{ directory.id }}</span>
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

  <ElDialog v-model="createDialog" title="폴더 생성">
    <ElForm label-position="left" :model="createDirectoryOptions">
      <ElFormItem label="활성화">
        <ElSwitch v-model="createDirectoryOptions.enabled" />
      </ElFormItem>
      <ElFormItem label="폴더 경로">
        <ElInput v-model="createDirectoryOptions.path" />
      </ElFormItem>
      <ElFormItem label="하위 폴더까지 탐색">
        <ElSwitch v-model="createDirectoryOptions.recursive" />
      </ElFormItem>
      <ElAlert type="warning" show-icon :closable="false" style="margin-bottom: 10px">
        <span>폴링 간격이 너무 짧으면 CPU 사용량이 높아질 수 있습니다.</span>
      </ElAlert>
      <ElFormItem label="폴링 사용">
        <ElSwitch v-model="createDirectoryOptions.usePolling" />
      </ElFormItem>
      <ElFormItem v-if="createDirectoryOptions.usePolling" label="폴링 간격 (ms)">
        <ElInputNumber v-model="createDirectoryOptions.interval" :min="100" :step="100" />
      </ElFormItem>
      <ElFormItem label=".으로 시작하는 파일 무시">
        <ElSwitch v-model="createDirectoryOptions.ignoreDotFiles" />
      </ElFormItem>
      <div class="end">
        <ElButton @click="createDialog = false">취소</ElButton>
        <ElButton
          type="primary"
          @click="createDirectory()"
          :loading="creatingDirectory"
          :disabled="createDirectoryOptions.path === ''"
        >
          생성
        </ElButton>
      </div>
    </ElForm>
  </ElDialog>

  <RemoveWatchDirectoryDialog
    v-model="removeDialog"
    :directory-id="currentDirectoryId"
    @removed="refreshWatchDirectories()"
  />

  <!-- <ElDialog v-model="removeDialog" title="폴더 삭제">
    <span class="bold">폴더 #{{ currentDirectoryId }}</span>
    <span>을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다!</span>

    <template #footer>
      <ElButton @click="removeDialog = false">취소</ElButton>
      <ElButton type="danger" @click="removeDirectory(currentDirectoryId)" :loading="removingDirectory">삭제</ElButton>
    </template>
  </ElDialog> -->
</template>

<script setup lang="ts">
import { Delete, Edit, Plus } from "@element-plus/icons-vue";
import type { WatchDirectory } from "@/types";
import { useRouter } from "vue-router";
import { h, ref } from "vue";
import type { Ref } from "vue";
import { ElMessage } from "element-plus";
import RemoveWatchDirectoryDialog from "@/components/RemoveWatchDirectoryDialog.vue";

const router = useRouter();
const currentDirectoryId = ref(0);
const createDirectoryOptions: Ref<Omit<WatchDirectory, "id">> = ref({
  enabled: true,
  path: "",
  recursive: false,
  usePolling: false,
  interval: 5000,
  ignoreDotFiles: true,
});

const createDialog = ref(false);
const creatingDirectory = ref(false);

async function openCreateDialog() {
  createDirectoryOptions.value.enabled = true;
  createDirectoryOptions.value.path = "";
  createDirectoryOptions.value.recursive = false;
  createDirectoryOptions.value.usePolling = false;
  createDirectoryOptions.value.interval = 5000;
  createDirectoryOptions.value.ignoreDotFiles = false;

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

// const removingDirectory = ref(false);
// async function removeDirectory(id: number) {
//   removingDirectory.value = true;
//   const request = await fetch("/api/watch-directory/" + id, {
//     method: "DELETE",
//   }).then((res) => res.json());
//   removeDialog.value = false;
//   removingDirectory.value = false;
//   if (request.success) {
//     ElMessage({
//       type: "success",
//       message: "폴더를 삭제했습니다.",
//     });
//   } else {
//     ElMessage({
//       type: "error",
//       message: h("div", null, [h("p", null, "폴더를 삭제하지 못했습니다."), h("p", null, request.error)]),
//     });
//   }
//   await refreshWatchDirectories();
// }

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
    ElMessage.error("폴더 목록을 불러오지 못했습니다..");
    return;
  }
  watchDirectories.value = response;
}
await refreshWatchDirectories();
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1em;
}
.end {
  display: flex;
  justify-content: flex-end;
}
.folder-id {
  margin-right: 0.5rem;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
