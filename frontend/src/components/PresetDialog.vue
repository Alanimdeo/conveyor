<template>
  <ElDialog
    v-model="opened"
    title="프리셋 선택"
    style="max-width: 560px; width: 100%"
  >
    <div class="end mb top-bar">
      <ElInput class="search" v-model="query" placeholder="검색"></ElInput>
    </div>
    <span v-for="preset in presets" :key="preset.id">
      <div v-if="!queryRegExp || queryRegExp.test(preset.name)" class="preset">
        <ElButton
          class="left-align"
          plain
          size="large"
          @click="selectPreset(preset.id)"
        >
          {{ preset.name || "이름 없는 프리셋 " + preset.id }}
        </ElButton>
      </div>
    </span>

    <ElEmpty
      v-if="presets.length === 0"
      description="프리셋이 없습니다. 프리셋 탭에서 추가해 보세요!"
    />

    <div class="end">
      <ElButton @click="opened = false">취소</ElButton>
    </div>
  </ElDialog>

  <ElDialog v-model="confirmDialog" title="선택 확인">
    <div v-if="selectedPresetCustomParameters.length > 0" class="mb">
      <ElText style="margin-bottom: 1rem" size="large">
        사용자 정의 매개변수
      </ElText>
      <div
        v-for="parameter in selectedPresetCustomParameters"
        :key="parameter.key"
      >
        <ElFormItem :label="parameter.label">
          <ElInput v-model="customParameters[parameter.key]" />
        </ElFormItem>
      </div>
    </div>
    <span class="mb">
      프리셋을 불러오면 기존에 작성한 모든 내용이 사라집니다.
    </span>

    <template #footer>
      <ElButton @click="confirmDialog = false">취소</ElButton>
      <ElButton type="primary" @click="confirm(selectedPresetId)"
        >확인</ElButton
      >
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import type {
  CustomParameter,
  WatchConditionPreset,
  WatchDirectoryPreset,
} from "@conveyor/types";
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getRegExp } from "korean-regexp";

const props = defineProps<{
  modelValue: boolean;
  type: string;
}>();
const emit = defineEmits(["update:modelValue", "select"]);

const opened = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const presets = ref<WatchDirectoryPreset[] | WatchConditionPreset[]>([]);
const selectedPresetId = ref(-1);

const selectedPresetCustomParameters = ref<CustomParameter[]>([]);
const customParameters = ref<{ [key: string]: string }>({});

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

watch(opened, async (value) => {
  if (!value) return;

  const response = await fetch(`/api/${props.type}-preset`).then((res) => {
    if (res.ok) {
      return res.json();
    } else {
      opened.value = false;
      ElMessage.error("프리셋을 불러오지 못했습니다.");
    }
  });

  presets.value = response;
});

const confirmDialog = ref(false);

async function selectPreset(id: number) {
  selectedPresetId.value = id;
  selectedPresetCustomParameters.value =
    (await fetchCustomParameters(id)) || [];
  customParameters.value = {};
  for (const parameter of selectedPresetCustomParameters.value) {
    customParameters.value[parameter.key] = "";
  }

  confirmDialog.value = true;
}

async function fetchCustomParameters(id: number) {
  const response: WatchDirectoryPreset | WatchConditionPreset | undefined =
    await fetch(`/api/${props.type}-preset/${id}`).then((res) => {
      if (res.ok) {
        return res.json();
      } else {
        ElMessage.error("프리셋을 불러오지 못했습니다.");
      }
    });
  return response?.customParameters;
}

async function confirm(id: number) {
  const response = await fetch(`/api/${props.type}-preset/${id}`).then(
    (res) => {
      if (res.ok) {
        return res.json();
      } else {
        ElMessage.error("프리셋을 불러오지 못했습니다.");
      }
    }
  );
  response.id = undefined;
  opened.value = false;
  confirmDialog.value = false;
  ElMessage.success("프리셋을 불러왔습니다.");
  emit("select", response, customParameters.value);
}
</script>

<style scoped>
.top-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
}
.search {
  width: 12rem;
}
.preset {
  display: block;
  margin-bottom: 1rem;
}
.preset > button {
  width: 100%;
  margin: 0;
}
.left-align {
  justify-content: left;
}
</style>
