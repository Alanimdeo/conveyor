<template>
  <div class="tabs">
    <ElTabs v-model="activeTab">
      <ElTabPane label="감시 폴더" name="watch-directories">
        <div class="container">
          <div class="end top-bar">
            <ElInput
              class="search"
              v-model="query"
              placeholder="검색"
            ></ElInput>
            <ElButton
              type="primary"
              :icon="Plus"
              @click="openCreateWatchDirectoryDialog"
              >추가</ElButton
            >
          </div>

          <ElEmpty
            v-if="watchDirectoryPresets.length === 0"
            description="감시 폴더 프리셋이 없습니다. 추가 버튼을 눌러 추가해 보세요!"
          />

          <span v-else v-for="preset in watchDirectoryPresets" :key="preset.id">
            <ElCard v-if="!queryRegExp || queryRegExp.test(preset.name)">
              <div class="card-header">
                <div>
                  <span class="folder-name">
                    <span v-if="preset.name">
                      {{ preset.name }}
                    </span>
                    <span v-else>
                      <span>이름 없는 폴더</span>
                      <span class="folder-id">#{{ preset.id }}</span>
                    </span>
                  </span>
                </div>
                <div>
                  <ElButton
                    link
                    type="primary"
                    :icon="Edit"
                    @click="editWatchDirectoryPresetDialog(preset.id)"
                  >
                    편집
                  </ElButton>
                  <ElButton
                    link
                    type="danger"
                    :icon="Delete"
                    @click="
                      removeTypeId = { type: 'watch-directory', id: preset.id };
                      removeDialog = true;
                    "
                  >
                    삭제
                  </ElButton>
                </div>
              </div>
            </ElCard>
          </span>
        </div>
      </ElTabPane>
      <ElTabPane label="감시 조건" name="watch-conditions">
        <div class="container">
          <div class="end top-bar">
            <ElInput
              class="search"
              v-model="query"
              placeholder="검색"
            ></ElInput>
            <ElButton
              type="primary"
              :icon="Plus"
              @click="openCreateWatchConditionDialog()"
              >추가</ElButton
            >
          </div>

          <ElEmpty
            v-if="watchConditionPresets.length === 0"
            description="감시 조건 프리셋이 없습니다. 추가 버튼을 눌러 추가해 보세요!"
          />

          <span v-else v-for="preset in watchConditionPresets" :key="preset.id">
            <ElCard v-if="!queryRegExp || queryRegExp.test(preset.name)">
              <div class="card-header">
                <div>
                  <span class="folder-name">
                    <span v-if="preset.name">
                      {{ preset.name }}
                    </span>
                    <span v-else>
                      <span>이름 없는 조건</span>
                      <span class="folder-id">#{{ preset.id }}</span>
                    </span>
                  </span>
                </div>
                <div>
                  <ElButton
                    link
                    type="primary"
                    :icon="Edit"
                    @click="editWatchConditionPresetDialog(preset.id)"
                  >
                    편집
                  </ElButton>
                  <ElButton
                    link
                    type="danger"
                    :icon="Delete"
                    @click="
                      removeTypeId = { type: 'watch-condition', id: preset.id };
                      removeDialog = true;
                    "
                  >
                    삭제
                  </ElButton>
                </div>
              </div>
            </ElCard>
          </span>
        </div>
      </ElTabPane>
    </ElTabs>
  </div>

  <WatchDirectoryDialog
    v-model="watchDirectoryDialog"
    :options="selectedWatchDirectoryPreset"
    :loading="watchDirectorySubmitting"
    :title="watchDirectoryDialogTexts[watchDirectoryDialogMode].title"
    :submit-button-text="
      watchDirectoryDialogTexts[watchDirectoryDialogMode].submit
    "
    :disabled="!allowSave"
    @create="submitWatchDirectoryPreset()"
  >
    <template #after>
      <PresetCustomParameters
        v-model="allowSave"
        :parameters="selectedWatchDirectoryPreset.customParameters"
      />
    </template>
  </WatchDirectoryDialog>

  <WatchConditionDialog
    v-model="watchConditionDialog"
    :options="selectedWatchConditionPreset"
    :loading="watchConditionSubmitting"
    v-model:has-rename-pattern="selectedWatchConditionHasRenamePattern"
    :rename-pattern="selectedWatchConditionRenamePattern"
    :title="watchConditionDialogTexts[watchConditionDialogMode].title"
    :submit-button-text="
      watchConditionDialogTexts[watchConditionDialogMode].submit
    "
    :disabled="!allowSave"
    @create="submitWatchConditionPreset()"
  >
    <template #after>
      <PresetCustomParameters
        v-model="allowSave"
        :parameters="selectedWatchConditionPreset.customParameters"
      />
    </template>
  </WatchConditionDialog>

  <RemoveDialog
    v-model="removeDialog"
    title="프리셋 삭제"
    :name="removeName"
    @confirm="remove()"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { Delete, Edit, Plus } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { getRegExp } from "korean-regexp";
import { canSaveCustomParameters } from "@/utils";
import type {
  RenamePattern,
  WatchConditionPreset,
  WatchDirectoryPreset,
} from "@conveyor/types";
import WatchDirectoryDialog from "@/components/WatchDirectoryDialog.vue";
import WatchConditionDialog from "@/components/WatchConditionDialog.vue";
import RemoveDialog from "@/components/RemoveDialog.vue";
import PresetCustomParameters from "@/components/PresetCustomParameters.vue";

const allowSave = ref(false);

const activeTab = ref("watch-directories");

const watchDirectoryPresets = ref<WatchDirectoryPreset[]>([]);

const watchDirectoryDialog = ref(false);
const watchDirectoryDialogMode = ref<"create" | "edit">("create");
const watchDirectoryDialogTexts = {
  create: {
    title: "감시 폴더 프리셋 추가",
    submit: "추가",
  },
  edit: {
    title: "감시 폴더 프리셋 편집",
    submit: "편집",
  },
};
const selectedWatchDirectoryPreset = ref<
  { id?: number } & Omit<WatchDirectoryPreset, "id">
>({
  name: "",
  enabled: true,
  path: "",
  recursive: true,
  usePolling: false,
  interval: 5000,
  ignoreDotFiles: true,
  customParameters: [],
});
const watchDirectorySubmitting = ref(false);

function openCreateWatchDirectoryDialog() {
  watchDirectoryDialogMode.value = "create";

  selectedWatchDirectoryPreset.value = {
    name: "",
    enabled: true,
    path: "",
    recursive: true,
    usePolling: false,
    interval: 5000,
    ignoreDotFiles: true,
    customParameters: [],
  };
  allowSave.value = true;

  watchDirectoryDialog.value = true;
}

async function editWatchDirectoryPresetDialog(id: number) {
  watchDirectoryDialogMode.value = "edit";

  const preset = await fetch(`/api/watch-directory-preset/${id}`).then((res) =>
    res.json()
  );

  selectedWatchDirectoryPreset.value = Object.assign({}, preset);
  allowSave.value = canSaveCustomParameters(
    selectedWatchDirectoryPreset.value.customParameters
  );

  watchDirectoryDialog.value = true;
}

async function submitWatchDirectoryPreset() {
  watchDirectorySubmitting.value = true;

  const response = await fetch(
    `/api/watch-directory-preset${
      watchDirectoryDialogMode.value === "edit"
        ? "/" + selectedWatchDirectoryPreset.value.id
        : ""
    }`,
    {
      method: watchDirectoryDialogMode.value === "create" ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(selectedWatchDirectoryPreset.value),
    }
  );
  if (!response.ok) {
    ElMessage.error(
      `프리셋을 ${watchDirectoryDialogTexts[watchDirectoryDialogMode.value].submit}하는 데 실패했습니다.`
    );
    watchDirectorySubmitting.value = false;
    return;
  }

  ElMessage.success(
    `프리셋을 ${watchDirectoryDialogTexts[watchDirectoryDialogMode.value].submit}했습니다.`
  );
  watchDirectoryDialog.value = false;
  watchDirectorySubmitting.value = false;
  await fetchWatchDirectoryPresets();
}

const watchConditionPresets = ref<WatchConditionPreset[]>([]);

const watchConditionDialog = ref(false);
const watchConditionDialogMode = ref<"create" | "edit">("create");
const watchConditionDialogTexts = {
  create: {
    title: "감시 조건 프리셋 추가",
    submit: "추가",
  },
  edit: {
    title: "감시 조건 프리셋 편집",
    submit: "편집",
  },
};
const selectedWatchConditionPreset = ref<
  { id?: number } & Omit<WatchConditionPreset, "id">
>({
  name: "",
  enabled: true,
  type: "all",
  priority: 0,
  useRegExp: false,
  pattern: "",
  destination: "",
  delay: 0,
  customParameters: [],
});
const selectedWatchConditionHasRenamePattern = ref(false);
const selectedWatchConditionRenamePattern = ref<RenamePattern>({
  useRegExp: false,
  pattern: "",
  replaceValue: "",
  excludeExtension: true,
});
const watchConditionSubmitting = ref(false);

function openCreateWatchConditionDialog() {
  watchConditionDialogMode.value = "create";

  selectedWatchConditionPreset.value = {
    name: "",
    enabled: true,
    type: "all",
    priority: 0,
    useRegExp: false,
    pattern: "",
    destination: "",
    delay: 0,
    customParameters: [],
  };
  selectedWatchConditionHasRenamePattern.value = false;
  selectedWatchConditionRenamePattern.value = {
    useRegExp: false,
    pattern: "",
    replaceValue: "",
    excludeExtension: true,
  };
  allowSave.value = true;

  watchConditionDialog.value = true;
}

async function editWatchConditionPresetDialog(id: number) {
  watchConditionDialogMode.value = "edit";

  const preset = await fetch(`/api/watch-condition-preset/${id}`).then((res) =>
    res.json()
  );

  selectedWatchConditionPreset.value = Object.assign({}, preset);
  selectedWatchConditionHasRenamePattern.value = !!preset.renamePattern;
  if (selectedWatchConditionPreset.value.renamePattern) {
    selectedWatchConditionRenamePattern.value = Object.assign(
      {},
      selectedWatchConditionPreset.value.renamePattern
    );
    selectedWatchConditionPreset.value.renamePattern = undefined;
  }
  allowSave.value = canSaveCustomParameters(
    selectedWatchConditionPreset.value.customParameters
  );

  watchConditionDialog.value = true;
}

async function submitWatchConditionPreset() {
  watchConditionSubmitting.value = true;

  const response = await fetch(
    `/api/watch-condition-preset${
      watchConditionDialogMode.value === "edit"
        ? "/" + selectedWatchConditionPreset.value.id
        : ""
    }`,
    {
      method: watchConditionDialogMode.value === "create" ? "POST" : "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...selectedWatchConditionPreset.value,
        renamePattern: selectedWatchConditionHasRenamePattern.value
          ? selectedWatchConditionRenamePattern.value
          : undefined,
      }),
    }
  );
  if (!response.ok) {
    ElMessage.error(
      `프리셋을 ${watchConditionDialogTexts[watchConditionDialogMode.value].submit}하는 데 실패했습니다.`
    );
    watchConditionSubmitting.value = false;
    return;
  }

  ElMessage.success(
    `프리셋을 ${watchConditionDialogTexts[watchConditionDialogMode.value].submit}했습니다.`
  );
  watchConditionDialog.value = false;
  watchConditionSubmitting.value = false;
  await fetchWatchConditionPresets();
}

async function fetchWatchDirectoryPresets() {
  const response = await fetch("/api/watch-directory-preset");
  watchDirectoryPresets.value = await response.json();
}

async function fetchWatchConditionPresets() {
  const response = await fetch("/api/watch-condition-preset");
  watchConditionPresets.value = await response.json();
}

const removeDialog = ref(false);
const removeTypeId = ref<{
  type: "watch-directory" | "watch-condition";
  id: number;
}>({
  type: "watch-directory",
  id: 0,
});
const removeName = ref("");
watch(removeTypeId, (value) => {
  if (value.id === 0) {
    removeName.value = "";
    return;
  }

  if (removeTypeId.value.type === "watch-directory") {
    removeName.value =
      watchDirectoryPresets.value.find((preset) => preset.id === value.id)
        ?.name || `이름 없는 폴더 #${value.id}`;
  } else {
    removeName.value =
      watchConditionPresets.value.find((preset) => preset.id === value.id)
        ?.name || `이름 없는 조건 #${value.id}`;
  }
});
async function remove() {
  const response = await fetch(
    `/api/${removeTypeId.value.type}-preset/${removeTypeId.value.id}`,
    {
      method: "DELETE",
    }
  );
  if (!response.ok) {
    ElMessage.error("프리셋을 삭제하는 데 실패했습니다.");
    return;
  }

  removeDialog.value = false;
  ElMessage.success("프리셋을 삭제했습니다.");
  if (removeTypeId.value.type === "watch-directory") {
    await fetchWatchDirectoryPresets();
  } else {
    await fetchWatchConditionPresets();
  }
}

const query = ref("");
const queryRegExp = ref<RegExp | null>(null);
watch(query, (value) => {
  if (value === "") {
    queryRegExp.value = null;
    return;
  }
  queryRegExp.value = getRegExp(value, {
    fuzzy: true,
    ignoreCase: true,
    initialSearch: true,
  });
});

watch(activeTab, (value, oldValue) => {
  if (value === oldValue) {
    return;
  }
  query.value = "";
});

await fetchWatchDirectoryPresets();
await fetchWatchConditionPresets();
</script>

<style scoped>
.tabs {
  padding: 0 0.5rem;
}
.folder-name {
  margin-right: 0.5rem;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.folder-id {
  font-size: 1rem;
  font-weight: 300;
  color: #777;
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
