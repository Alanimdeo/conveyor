<template>
  <ElPageHeader @back="router.back()">
    <template #content>
      <div class="title">
        <span class="folder-name">
          <span v-if="watchDirectory.name">
            {{ watchDirectory.name }}
          </span>
          <span v-else>
            <span> 이름 없는 폴더 </span>
            <span class="big thin gray">#{{ watchDirectory.id }}</span>
          </span>
        </span>
        <ElTag v-if="watchDirectory.enabled" type="success">사용 중</ElTag>
        <ElTag v-else type="danger">비활성화</ElTag>
      </div>
    </template>
    <template #extra>
      <div v-if="width >= 512" class="title">
        <ElButton
          type="success"
          :icon="Files"
          @click="
            presetDialogMode = 'watch-directory';
            presetDialog = true;
          "
        >
          프리셋
        </ElButton>
        <ElButton
          type="primary"
          :icon="Check"
          @click="saveWatchDirectory()"
          :loading="savingWatchDirectory"
          :disabled="isEqual(watchDirectoryInitial, watchDirectory)"
        >
          저장
        </ElButton>
        <ElButton type="danger" :icon="Delete" @click="removeDirectoryDialog = true">삭제</ElButton>
      </div>
      <div v-else class="title">
        <ElButton
          type="primary"
          :icon="Check"
          @click="saveWatchDirectory()"
          :disabled="isEqual(watchDirectoryInitial, watchDirectory)"
        />
        <ElButton type="danger" :icon="Delete" @click="removeDirectoryDialog = true" />
      </div>
    </template>
    <div class="tabs">
      <ElTabs v-model="activeTab">
        <ElTabPane label="설정" name="settings">
          <ElForm :model="watchDirectory">
            <p>일반</p>
            <ElFormItem label="이름">
              <ElInput v-model="watchDirectory.name" />
            </ElFormItem>
            <ElFormItem label="활성화">
              <ElSwitch v-model="watchDirectory.enabled" />
            </ElFormItem>
            <ElFormItem label="경로" class="input">
              <ElInput v-model="watchDirectory.path" />
            </ElFormItem>
            <p>감시 설정</p>
            <div class="horizontal">
              <ElFormItem label="하위 폴더까지 탐색">
                <ElSwitch v-model="watchDirectory.recursive" />
              </ElFormItem>
              <ElFormItem label=".으로 시작하는 파일 무시">
                <ElSwitch v-model="watchDirectory.ignoreDotFiles" />
              </ElFormItem>
            </div>
            <p>폴링</p>
            <div class="alert">
              <ElAlert type="info" show-icon :closable="false" style="margin-bottom: 10px">
                <span>Conveyor가 변경 내용을 감지하지 못할 경우 폴링을 사용하도록 설정해 보세요.</span>
              </ElAlert>
              <ElAlert type="warning" show-icon :closable="false" style="margin-bottom: 10px">
                <span>폴링 간격이 너무 짧으면 CPU 사용량이 높아질 수 있습니다.</span>
              </ElAlert>
            </div>
            <div class="horizontal">
              <ElFormItem label="폴링 사용">
                <ElSwitch v-model="watchDirectory.usePolling" />
              </ElFormItem>
              <ElFormItem v-if="watchDirectory.usePolling" label="폴링 간격 (ms)">
                <ElInputNumber v-model="watchDirectory.interval" :min="100" :step="100" />
              </ElFormItem>
            </div>
          </ElForm>
        </ElTabPane>

        <ElTabPane label="감시 조건" name="conditions">
          <div class="container">
            <div class="end top-bar">
              <ElInput class="search" v-model="query" placeholder="검색"></ElInput>
              <ElButton type="primary" :icon="Plus" @click="openCreateDialog()"> 추가 </ElButton>
            </div>

            <ElEmpty
              v-if="watchConditions.length === 0"
              description="감시 조건이 없습니다. 추가 버튼을 눌러 추가해 보세요!"
            />

            <span v-else v-for="condition in watchConditions" :key="condition.id">
              <ElCard v-if="!queryRegExp || queryRegExp.test(condition.name)">
                <template #header>
                  <div class="card-header">
                    <div>
                      <span class="card-title">{{ condition.name || "이름 없는 조건" }}</span>
                      <ElTag v-if="condition.enabled" type="success">사용 중</ElTag>
                      <ElTag v-else type="danger">비활성화</ElTag>
                    </div>
                    <div>
                      <ElButton link type="primary" :icon="Edit" @click="editWatchCondition(condition.id)">
                        편집
                      </ElButton>
                      <ElButton
                        link
                        type="danger"
                        :icon="Delete"
                        @click="
                          removeConditionId = condition.id;
                          removeConditionDialog = true;
                        "
                      >
                        삭제
                      </ElButton>
                    </div>
                  </div>
                </template>

                <span class="big">설정</span>
                <div class="card-content mb">
                  <div>
                    <span>우선 순위: </span>
                    <span>{{ condition.priority }}</span>
                  </div>
                  <div>
                    <span>감시 대상: </span>
                    <span>{{ watchTypes[condition.type] }}</span>
                  </div>
                  <div>
                    <span>정규식 사용: </span>
                    <VXIcon v-model="condition.useRegExp" />
                  </div>
                  <div>
                    <span>패턴: </span>
                    <span>{{ condition.pattern }}</span>
                  </div>
                  <div>
                    <span>이동 경로: </span>
                    <span>{{ condition.destination === "$" ? "이동 안 함" : condition.destination }}</span>
                  </div>
                  <div>
                    <span>이동 지연: </span>
                    <span>{{ condition.delay }} ms</span>
                  </div>
                </div>

                <span class="big">이름 변경 규칙</span>
                <div class="card-content">
                  <div>
                    <span>사용: </span>
                    <VXIcon v-model="condition.renamePattern" />
                  </div>
                  <div v-if="condition.renamePattern" class="card-content-inner">
                    <div>
                      <span>정규식 사용: </span>
                      <VXIcon v-model="condition.renamePattern.useRegExp" />
                    </div>
                    <div>
                      <span>확장자 제외: </span>
                      <VXIcon v-model="condition.renamePattern.excludeExtension" />
                    </div>
                    <div>
                      <span>패턴: </span>
                      <span>{{ condition.renamePattern.pattern }}</span>
                    </div>
                    <div>
                      <span>바꿀 이름: </span>
                      <span>{{ condition.renamePattern.replaceValue }}</span>
                    </div>
                  </div>
                </div>
              </ElCard>
            </span>
          </div>
        </ElTabPane>
      </ElTabs>
    </div>
  </ElPageHeader>

  <RemoveDialog
    v-model="removeDirectoryDialog"
    title="폴더 삭제"
    :name="selectedDirectoryName"
    :loading="removingDirectory"
    @confirm="removeDirectory()"
  >
    <template #message>
      <span> 폴더를 삭제하시겠습니까? 이 작업은 해당 폴더 및 모든 하위 조건들을 삭제하며 되돌릴 수 없습니다!</span>
    </template>
  </RemoveDialog>

  <RemoveDialog
    v-model="removeConditionDialog"
    title="조건 삭제"
    :name="watchConditions.find((condition) => condition.id === removeConditionId)?.name || '이름 없는 조건'"
    :loading="removingContition"
    @confirm="removeCondition(removeConditionId)"
  />

  <WatchConditionDialog
    v-model="createConditionDialog"
    :loading="creatingCondition"
    :options="createConditionOptions"
    v-model:has-rename-pattern="createConditionOptionsHasRenamePattern"
    :rename-pattern="createConditionRenamePattern"
    :title="dialogTexts[conditionDialogMode].title"
    :submit-button-text="dialogTexts[conditionDialogMode].submit"
    @create="createCondition()"
  >
    <template #before>
      <div class="mb end">
        <ElButton
          type="success"
          :icon="Files"
          @click="
            presetDialogMode = 'watch-condition';
            presetDialog = true;
          "
        >
          프리셋
        </ElButton>
      </div>
    </template>
  </WatchConditionDialog>

  <PresetDialog v-model="presetDialog" :type="presetDialogMode" @select="onPresetSelect" />
</template>

<script setup lang="ts">
import { h, ref, computed, watch } from "vue";
import type { Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { isEqual } from "lodash";
import { ElMessage } from "element-plus";
import { getRegExp } from "korean-regexp";
import { Check, Delete, Edit, Plus, Files } from "@element-plus/icons-vue";
import type {
  WatchDirectory,
  WatchCondition,
  RenamePattern,
  WatchDirectoryPreset,
  WatchConditionPreset,
} from "@conveyor/types";
import WatchConditionDialog from "@/components/WatchConditionDialog.vue";
import RemoveDialog from "@/components/RemoveDialog.vue";
import PresetDialog from "@/components/PresetDialog.vue";
import VXIcon from "@/components/VXIcon.vue";

const width = ref(window.innerWidth);
window.addEventListener("resize", () => {
  width.value = window.innerWidth;
});

const router = useRouter();
const route = useRoute();

const removeDirectoryDialog = ref(false);

type Tab = "settings" | "conditions";
const activeTab: Ref<Tab> = ref("settings");

const directoryId = Number(route.params.id);
const watchDirectoryResponse = await fetch("/api/watch-directory/" + directoryId).then(async (res) => {
  try {
    return await res.json();
  } catch (e) {
    return { error: "서버에서 응답을 받지 못했습니다." };
  }
});
if (watchDirectoryResponse.error) {
  router.replace("/directory");
}

const watchDirectoryInitial: Ref<WatchDirectory> = ref(Object.assign({}, watchDirectoryResponse));
const watchDirectory: Ref<WatchDirectory> = ref(watchDirectoryResponse);

const savingWatchDirectory = ref(false);

async function saveWatchDirectory() {
  savingWatchDirectory.value = true;
  const response = await fetch("/api/watch-directory/" + directoryId, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(watchDirectory.value),
  }).then(async (res) => {
    try {
      return await res.json();
    } catch (e) {
      return { error: "서버에서 응답을 받지 못했습니다." };
    }
  });
  if (response.error) {
    ElMessage.error("감시 폴더를 저장하지 못했습니다.");
    savingWatchDirectory.value = false;
    return;
  }
  watchDirectoryInitial.value = Object.assign({}, watchDirectory.value);
  ElMessage.success("감시 폴더를 저장했습니다.");
  savingWatchDirectory.value = false;
}

const selectedDirectoryName = computed(() => watchDirectory.value.name || `이름 없는 폴더 #${watchDirectory.value.id}`);

const removingDirectory = ref(false);
async function removeDirectory() {
  removingDirectory.value = true;
  const response = await fetch("/api/watch-directory/" + watchDirectory.value.id, {
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
  removeDirectoryDialog.value = false;
  removingDirectory.value = false;
  router.replace("/directory");
}

const watchConditions: Ref<WatchCondition[]> = ref([]);
async function refreshWatchConditions() {
  const response = await fetch(`/api/watch-directory/${directoryId}/conditions`).then(async (res) => {
    try {
      return await res.json();
    } catch (e) {
      return { error: "서버에서 응답을 받지 못했습니다." };
    }
  });
  if (response.error) {
    ElMessage.error("감시 조건을 불러오지 못했습니다.");
    return;
  }
  watchConditions.value = response;
}

const watchTypes = {
  file: "파일",
  directory: "폴더",
  all: "파일 및 폴더",
};

const removeConditionDialog = ref(false);
const removeConditionId = ref(-1);

const removingContition = ref(false);
async function removeCondition(id: number) {
  removingContition.value = true;
  const request = await fetch("/api/watch-condition/" + id, {
    method: "DELETE",
  }).then((res) => res.json());
  removeConditionDialog.value = false;
  removingContition.value = false;
  if (request.success) {
    ElMessage.success("감시 조건을 삭제했습니다.");
  } else {
    ElMessage.error(h("div", null, [h("p", null, "감시 조건을 삭제하지 못했습니다."), h("p", null, request.error)]));
  }
  await refreshWatchConditions();
}

const conditionDialogMode = ref<"create" | "edit">("create");
const createConditionOptions: Ref<{ id?: number } & Omit<WatchCondition, "id">> = ref({
  name: "",
  directoryId: directoryId,
  enabled: true,
  priority: 0,
  type: "all",
  useRegExp: false,
  pattern: "",
  destination: "",
  delay: 0,
});
const createConditionOptionsHasRenamePattern = ref(false);
const createConditionRenamePattern: Ref<RenamePattern> = ref({
  useRegExp: false,
  pattern: "",
  replaceValue: "",
  excludeExtension: true,
});

function openCreateDialog() {
  conditionDialogMode.value = "create";
  createConditionOptions.value = {
    name: "",
    directoryId: directoryId,
    enabled: true,
    priority: 0,
    type: "all",
    useRegExp: false,
    pattern: "",
    destination: "",
    delay: 0,
  };
  createConditionOptionsHasRenamePattern.value = false;
  createConditionRenamePattern.value = {
    useRegExp: false,
    pattern: "",
    replaceValue: "",
    excludeExtension: true,
  };
  createConditionDialog.value = true;
}

function editWatchCondition(id: number) {
  conditionDialogMode.value = "edit";
  createConditionOptions.value = Object.assign(
    {},
    watchConditions.value.find((condition) => condition.id === id)
  );
  if (createConditionOptions.value.renamePattern) {
    createConditionRenamePattern.value = Object.assign({}, createConditionOptions.value.renamePattern);
    createConditionOptionsHasRenamePattern.value = true;
  }
  createConditionDialog.value = true;
}

const createConditionDialog = ref(false);
const creatingCondition = ref(false);

const dialogTexts = {
  create: {
    title: "감시 조건 추가",
    submit: "추가",
  },
  edit: {
    title: "감시 조건 수정",
    submit: "수정",
  },
};

async function createCondition() {
  creatingCondition.value = true;
  const response = await fetch(
    `/api/watch-condition/${conditionDialogMode.value === "create" ? directoryId : createConditionOptions.value.id}`,
    {
      method: conditionDialogMode.value === "create" ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...createConditionOptions.value,
        renamePattern: createConditionOptionsHasRenamePattern.value ? createConditionRenamePattern.value : undefined,
      }),
    }
  ).then(async (res) => {
    try {
      return await res.json();
    } catch (e) {
      return { error: "서버에서 응답을 받지 못했습니다." };
    }
  });
  if (response.success) {
    ElMessage.success(`감시 조건을 ${dialogTexts[conditionDialogMode.value].submit}했습니다.`);
    await refreshWatchConditions();
  } else {
    ElMessage.error(
      h("div", null, [
        h("p", null, `감시 조건을 ${dialogTexts[conditionDialogMode.value].submit}하지 못했습니다.`),
        h("p", null, response.error),
      ])
    );
  }

  creatingCondition.value = false;
  createConditionDialog.value = false;
}

const presetDialog = ref(false);
const presetDialogMode = ref<"watch-directory" | "watch-condition">("watch-directory");

function onPresetSelect(preset: WatchDirectoryPreset | WatchConditionPreset) {
  if (presetDialogMode.value === "watch-directory") {
    const { name } = watchDirectory.value;
    watchDirectory.value = Object.assign({}, preset as WatchDirectoryPreset);
    watchDirectory.value.name = name;
  } else {
    const { name } = createConditionOptions.value;
    createConditionOptions.value = Object.assign(createConditionOptions.value, preset as WatchConditionPreset);
    createConditionOptions.value.name = name;
    if (createConditionOptions.value.renamePattern) {
      createConditionRenamePattern.value = Object.assign(
        createConditionRenamePattern.value,
        createConditionOptions.value.renamePattern
      );
      createConditionOptions.value.renamePattern = undefined;
      createConditionOptionsHasRenamePattern.value = true;
    } else {
      createConditionOptionsHasRenamePattern.value = false;
    }
  }
  presetDialog.value = false;
}

const query = ref("");
const queryRegExp = ref<RegExp | null>(null);
watch(query, (value) => {
  if (value === "") {
    queryRegExp.value = null;
    return;
  }
  queryRegExp.value = getRegExp(value, { fuzzy: true, ignoreCase: true, initialSearch: true });
});

await refreshWatchConditions();
</script>

<style scoped>
.title {
  display: flex;
  align-items: center;
}
.folder-name {
  font-size: 1.5rem;
  font-weight: 500;
  margin-right: 0.5rem;
}
.tabs {
  padding: 0 0.5rem;
}
.horizontal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  column-gap: 1rem;
}
.input {
  flex: 1;
}
.alert {
  display: inline-block;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  margin-right: 0.5rem;
}
.card-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0 0.4rem;
}
.card-content-inner {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.top-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}
.search {
  width: 12rem;
}
</style>
