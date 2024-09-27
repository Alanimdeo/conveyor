<template>
  <ElDialog
    v-model="opened"
    :title="title || '폴더 생성'"
    style="max-width: 560px; width: 100%"
  >
    <slot name="before"></slot>
    <ElForm label-position="left" :model="options">
      <ElFormItem label="폴더 이름">
        <ElInput v-model="options.name" />
      </ElFormItem>
      <ElFormItem label="활성화">
        <ElSwitch v-model="options.enabled" />
      </ElFormItem>
      <ElFormItem label="폴더 경로">
        <ElInput v-model="options.path" />
      </ElFormItem>
      <ElFormItem label="하위 폴더까지 탐색">
        <ElSwitch v-model="options.recursive" />
      </ElFormItem>
      <ElFormItem label=".으로 시작하는 파일 무시">
        <ElSwitch v-model="options.ignoreDotFiles" />
      </ElFormItem>
      <div class="alert">
        <ElAlert
          type="info"
          show-icon
          :closable="false"
          style="margin-bottom: 10px"
        >
          <span
            >Conveyor가 변경 내용을 감지하지 못할 경우 폴링을 사용하도록 설정해
            보세요.</span
          >
        </ElAlert>
        <ElAlert
          type="warning"
          show-icon
          :closable="false"
          style="margin-bottom: 10px"
        >
          <span>폴링 간격이 너무 짧으면 CPU 사용량이 높아질 수 있습니다.</span>
        </ElAlert>
      </div>
      <ElFormItem label="폴링 사용">
        <ElSwitch v-model="options.usePolling" />
      </ElFormItem>
      <ElFormItem v-if="options.usePolling" label="폴링 간격 (ms)">
        <ElInputNumber v-model="options.interval" :min="100" :step="100" />
      </ElFormItem>
    </ElForm>
    <slot name="after"></slot>
    <div class="end">
      <ElButton @click="opened = false">취소</ElButton>
      <ElButton
        type="primary"
        @click="emit('create')"
        :loading="loading"
        :disabled="props.disabled || options.path === ''"
      >
        {{ submitButtonText || "생성" }}
      </ElButton>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { WatchDirectory } from "@conveyor/types";

const props = defineProps<{
  modelValue: boolean;
  loading: boolean;
  options: Partial<WatchDirectory>;
  title?: string;
  submitButtonText?: string;
  disabled?: boolean;
}>();
const emit = defineEmits(["update:modelValue", "create"]);

const opened = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>
