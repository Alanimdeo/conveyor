<template>
  <ElDialog v-model="opened" title="프리셋 선택" style="max-width: 560px; width: 100%">
    <div class="end mb top-bar">
      <ElInput class="search" v-model="query" placeholder="검색"></ElInput>
    </div>
    <span v-for="preset in presets" :key="preset.id">
      <div v-if="!queryRegExp || queryRegExp.test(preset.name)" class="preset">
        <ElButton
          class="left-align"
          plain
          size="large"
          @click="
            selectedPresetId = preset.id;
            confirmDialog = true;
          "
        >
          {{ preset.name || "이름 없는 프리셋 " + preset.id }}
        </ElButton>
      </div>
    </span>

    <ElEmpty v-if="presets.length === 0" description="프리셋이 없습니다. 프리셋 탭에서 추가해 보세요!" />

    <div class="end">
      <ElButton @click="opened = false">취소</ElButton>
    </div>
  </ElDialog>

  <ElDialog v-model="confirmDialog" title="선택 확인">
    프리셋을 불러오시겠습니까? 저장되지 않은 변경 사항은 모두 사라집니다.

    <template #footer>
      <ElButton @click="confirmDialog = false">취소</ElButton>
      <ElButton type="primary" @click="select(selectedPresetId)">확인</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import type { WatchConditionPreset, WatchDirectoryPreset } from "@conveyor/types";
import { computed, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { getRegExp } from "korean-regexp";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(["update:modelValue", "select"]);

const opened = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const presets = ref<WatchDirectoryPreset[] | WatchConditionPreset[]>([]);
const selectedPresetId = ref(-1);

const query = ref("");
const queryRegExp = ref<RegExp | null>(null);
watch(query, (value) => {
  if (value === "") {
    queryRegExp.value = null;
    return;
  }
  queryRegExp.value = getRegExp(value, { fuzzy: true, ignoreCase: true, initialSearch: true });
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

async function select(id: number) {
  const response = await fetch(`/api/${props.type}-preset/${id}`).then((res) => {
    if (res.ok) {
      return res.json();
    } else {
      ElMessage.error("프리셋을 불러오지 못했습니다.");
    }
  });
  response.id = undefined;
  opened.value = false;
  confirmDialog.value = false;
  ElMessage.success("프리셋을 불러왔습니다.");
  emit("select", response);
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
