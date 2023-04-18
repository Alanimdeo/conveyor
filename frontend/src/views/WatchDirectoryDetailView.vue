<template>
  <ElPageHeader @back="router.back()">
    <template #content>
      <div class="title">
        <span class="folder-id">{{ watchDirectory.name || "폴더 #" + watchDirectory.id }}</span>
        <ElTag v-if="watchDirectory.enabled" type="success">사용 중</ElTag>
        <ElTag v-else type="danger">비활성화</ElTag>
      </div>
    </template>
    <template #extra>
      <div v-if="width >= 512" class="title">
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
            <div class="end">
              <ElButton type="primary" :icon="Plus" @click="openCreateDialog()"> 추가 </ElButton>
            </div>

            <ElEmpty
              v-if="watchConditions.length === 0"
              description="감시 조건이 없습니다. 추가 버튼을 눌러 추가해 보세요!"
            />

            <ElCard v-else v-for="(condition, index) in watchConditions" :key="condition.id">
              <template #header>
                <div class="card-header">
                  <div>
                    <span class="card-title">{{ condition.name || "조건 " + (index + 1) }}</span>
                    <ElTag v-if="condition.enabled" type="success">사용 중</ElTag>
                    <ElTag v-else type="danger">비활성화</ElTag>
                  </div>
                  <div>
                    <ElButton
                      link
                      type="primary"
                      :icon="Edit"
                      @click="
                        createConditionId = condition.id;
                        createConditionDialog = true;
                      "
                    >
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
                  <span>{{
                    condition.destination === watchDirectory.path ? "이동 안 함" : condition.destination
                  }}</span>
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
          </div>
        </ElTabPane>
      </ElTabs>
    </div>
  </ElPageHeader>

  <RemoveWatchDirectoryDialog
    v-model="removeDirectoryDialog"
    :directory-id="watchDirectory.id"
    @removed="router.replace('/directory')"
  />

  <ElDialog v-model="removeConditionDialog" title="조건 삭제" style="max-width: 560px; width: 100%">
    <span class="bold">조건 {{ removeConditionId + 1 }}</span>
    <span>을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</span>

    <template #footer>
      <ElButton @click="removeConditionDialog = false">취소</ElButton>
      <ElButton type="danger" @click="removeCondition(removeConditionId)" :loading="removingContition">삭제</ElButton>
    </template>
  </ElDialog>

  <ElDialog
    v-model="createConditionDialog"
    :title="`조건 ${createConditionId === -1 ? '생성' : '편집'}`"
    style="max-width: 560px; width: 100%"
  >
    <ElForm label-position="left" :model="createConditionOptions">
      <ElFormItem label="이름">
        <ElInput v-model="createConditionOptions.name" />
      </ElFormItem>
      <ElFormItem label="활성화">
        <ElSwitch v-model="createConditionOptions.enabled" />
      </ElFormItem>
      <ElFormItem label="우선 순위">
        <ElInputNumber v-model="createConditionOptions.priority" :min="0" />
      </ElFormItem>
      <ElFormItem label="감시 유형">
        <ElRadioGroup v-model="createConditionOptions.type">
          <ElRadio :label="WatchType.All">파일 및 폴더</ElRadio>
          <ElRadio :label="WatchType.File">파일</ElRadio>
          <ElRadio :label="WatchType.Directory">폴더</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="정규식 사용">
        <ElSwitch v-model="createConditionOptions.useRegExp" />
      </ElFormItem>
      <ElFormItem label="패턴">
        <ElInput v-model="createConditionOptions.pattern" />
      </ElFormItem>
      <ElAlert type="warning" show-icon :closable="false" style="margin-bottom: 10px">
        <span>
          이동 경로에 파일 이름을 포함하지 마세요! 이 행위는 의도되지 않은 동작을 일으킬 수 있으며, 파일 손상의 위험성이
          있습니다.
        </span>
      </ElAlert>
      <ElFormItem label="이동 안 함">
        <ElSwitch v-model="noMove" />
      </ElFormItem>
      <ElFormItem v-if="!noMove" label="이동 경로">
        <ElInput v-model="createConditionOptions.destination" />
      </ElFormItem>
      <ElFormItem label="이동 지연">
        <ElInputNumber v-model="createConditionOptions.delay" :min="0" />
      </ElFormItem>
      <ElFormItem label="이름 변경 규칙">
        <ElSwitch v-model="createConditionOptionsHasRenamePattern" />
      </ElFormItem>
      <div v-if="createConditionOptionsHasRenamePattern">
        <p class="big">이름 변경 규칙</p>
        <ElFormItem label="정규식 사용">
          <ElSwitch v-model="createConditionRenamePattern.useRegExp" />
        </ElFormItem>
        <ElFormItem label="패턴">
          <ElInput v-model="createConditionRenamePattern.pattern" />
        </ElFormItem>
        <ElFormItem label="바꿀 이름">
          <ElInput v-model="createConditionRenamePattern.replaceValue" />
        </ElFormItem>
        <ElFormItem label="확장자 제외">
          <ElSwitch v-model="createConditionRenamePattern.excludeExtension" />
        </ElFormItem>
      </div>
      <div class="end">
        <ElButton @click="createConditionDialog = false">취소</ElButton>
        <ElButton
          type="primary"
          @click="createCondition()"
          :loading="creatingCondition"
          :disabled="
            createConditionOptions.pattern === '' ||
            createConditionOptions.destination === '' ||
            (createConditionOptionsHasRenamePattern && createConditionRenamePattern.pattern === '') ||
            (createConditionOptionsHasRenamePattern && createConditionRenamePattern.replaceValue === '')
          "
        >
          {{ createConditionId === -1 ? "생성" : "편집" }}
        </ElButton>
      </div>
    </ElForm>
  </ElDialog>
</template>

<script setup lang="ts">
import { h, ref, watch } from "vue";
import type { Ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Check, Delete, Edit, Plus } from "@element-plus/icons-vue";
import { WatchType, type WatchCondition, type WatchDirectory, type RenamePattern } from "@/types";
import RemoveWatchDirectoryDialog from "@/components/RemoveWatchDirectoryDialog.vue";
import VXIcon from "@/components/VXIcon.vue";
import { isEqual } from "lodash";
import { ElMessage } from "element-plus";

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

const createConditionId = ref(-1);
const createConditionOptions: Ref<Omit<WatchCondition, "id">> = ref({
  name: "",
  directoryId: directoryId,
  enabled: true,
  priority: 0,
  type: WatchType.All,
  useRegExp: false,
  pattern: "",
  destination: "",
  delay: 0,
});
const noMove = ref(false);
const createConditionOptionsHasRenamePattern = ref(false);
const createConditionRenamePattern: Ref<RenamePattern> = ref({
  useRegExp: false,
  pattern: "",
  replaceValue: "",
  excludeExtension: true,
});

function openCreateDialog() {
  createConditionId.value = -1;
  createConditionOptions.value = {
    name: "",
    directoryId: directoryId,
    enabled: true,
    priority: 0,
    type: WatchType.All,
    useRegExp: false,
    pattern: "",
    destination: "",
    delay: 0,
  };
  noMove.value = false;
  createConditionOptionsHasRenamePattern.value = false;
  createConditionRenamePattern.value = {
    useRegExp: false,
    pattern: "",
    replaceValue: "",
    excludeExtension: true,
  };
  createConditionDialog.value = true;
}

watch(
  () => createConditionId.value,
  (id) => {
    if (id === -1) {
      createConditionOptions.value = {
        name: "",
        directoryId: directoryId,
        enabled: true,
        priority: 0,
        type: WatchType.All,
        useRegExp: false,
        pattern: "",
        destination: "",
        delay: 0,
      };
      noMove.value = false;
      createConditionOptionsHasRenamePattern.value = false;
      createConditionRenamePattern.value = {
        useRegExp: false,
        pattern: "",
        replaceValue: "",
        excludeExtension: true,
      };
    } else {
      createConditionOptions.value = Object.assign(
        {},
        watchConditions.value.find((condition) => condition.id === id)
      );
      noMove.value = createConditionOptions.value.destination === watchDirectory.value.path;
      if (createConditionOptions.value.renamePattern) {
        createConditionRenamePattern.value = Object.assign({}, createConditionOptions.value.renamePattern);
        createConditionOptionsHasRenamePattern.value = true;
      }
    }
  }
);

const createConditionDialog = ref(false);
const creatingCondition = ref(false);

async function createCondition() {
  creatingCondition.value = true;
  const response = await fetch(
    `/api/watch-condition/${createConditionId.value === -1 ? directoryId : createConditionId.value}`,
    {
      method: createConditionId.value === -1 ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...createConditionOptions.value,
        destination: noMove.value ? watchDirectory.value.path : createConditionOptions.value.destination,
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
    ElMessage.success(`감시 조건을 ${createConditionId.value === -1 ? "생성" : "저장"}했습니다.`);
    await refreshWatchConditions();
  } else {
    ElMessage.error(
      h("div", null, [
        h("p", null, `감시 조건을 ${createConditionId.value === -1 ? "생성" : "저장"}하지 못했습니다.`),
        h("p", null, response.error),
      ])
    );
  }

  creatingCondition.value = false;
  createConditionDialog.value = false;
}

await refreshWatchConditions();
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
.title {
  display: flex;
  align-items: center;
}
.folder-id {
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
.mb {
  margin-bottom: 1rem;
}
.big {
  font-size: 1.2rem;
}
.bold {
  font-weight: 600;
}
</style>
