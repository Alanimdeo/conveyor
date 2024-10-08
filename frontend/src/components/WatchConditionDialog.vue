<template>
  <ElDialog
    v-model="opened"
    :title="title || '조건 추가'"
    style="max-width: 560px; width: 100%"
  >
    <slot name="before"></slot>
    <ElForm label-position="left" :model="options">
      <ElFormItem label="이름">
        <ElInput v-model="options.name" />
      </ElFormItem>
      <ElFormItem label="활성화">
        <ElSwitch v-model="options.enabled" />
      </ElFormItem>
      <ElFormItem label="우선 순위">
        <ElInputNumber v-model="options.priority" :min="0" />
      </ElFormItem>
      <ElFormItem label="감시 유형">
        <ElRadioGroup v-model="options.type">
          <ElRadio value="all">파일 및 폴더</ElRadio>
          <ElRadio value="file">파일</ElRadio>
          <ElRadio value="directory">폴더</ElRadio>
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem label="정규식 사용">
        <ElSwitch v-model="options.useRegExp" />
      </ElFormItem>
      <ElFormItem label="패턴">
        <ElInput v-model="options.pattern" />
      </ElFormItem>
      <ElAlert
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 10px"
      >
        <span>
          이동 경로에 파일 이름을 포함하지 마세요! 이 행위는 의도되지 않은
          동작을 일으킬 수 있으며, 파일 손상의 위험성이 있습니다.
        </span>
      </ElAlert>
      <ElFormItem label="이동 안 함">
        <ElSwitch v-model="noMove" />
      </ElFormItem>
      <ElFormItem v-if="!noMove" label="이동 경로">
        <ElInput v-model="options.destination" />
      </ElFormItem>
      <ElFormItem label="이동 지연 (ms)">
        <ElInputNumber v-model="options.delay" :min="0" />
      </ElFormItem>
      <ElFormItem label="이름 변경 규칙">
        <ElSwitch v-model="hasRenamePattern" />
      </ElFormItem>
      <div v-if="hasRenamePattern">
        <p class="big">이름 변경 규칙</p>
        <ElFormItem label="정규식 사용">
          <ElSwitch v-model="renamePattern.useRegExp" />
        </ElFormItem>
        <ElFormItem label="패턴">
          <ElInput v-model="renamePattern.pattern" />
        </ElFormItem>
        <ElFormItem label="바꿀 이름">
          <ElInput v-model="renamePattern.replaceValue" />
        </ElFormItem>
        <ElFormItem label="확장자 제외">
          <ElSwitch v-model="renamePattern.excludeExtension" />
        </ElFormItem>
      </div>
    </ElForm>
    <slot name="after"></slot>
    <div class="end">
      <ElButton @click="opened = false">취소</ElButton>
      <ElButton
        type="primary"
        @click="emit('create')"
        :loading="loading"
        :disabled="
          props.disabled ||
          options.pattern == '' ||
          options.destination == '' ||
          (hasRenamePattern && renamePattern.pattern == '') ||
          (hasRenamePattern && renamePattern.replaceValue == '')
        "
      >
        {{ submitButtonText || "추가" }}
      </ElButton>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { RenamePattern, WatchCondition } from "@conveyor/types";

const props = defineProps<{
  modelValue: boolean;
  loading: boolean;
  options: Partial<WatchCondition>;
  hasRenamePattern: boolean;
  renamePattern: RenamePattern;
  title?: string;
  submitButtonText?: string;
  disabled?: boolean;
}>();
const emit = defineEmits([
  "update:modelValue",
  "update:hasRenamePattern",
  "create",
]);

const opened = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const hasRenamePattern = computed({
  get: () => props.hasRenamePattern,
  set: (value) => emit("update:hasRenamePattern", value),
});

const noMove = ref(false);
watch(noMove, (value) => {
  if (value) {
    props.options.destination = "$";
  } else {
    props.options.destination = "";
  }
});
watch(opened, (value) => {
  if (value && props.options.destination === "$") {
    noMove.value = true;
    props.options.destination = "$";
  } else {
    noMove.value = false;
  }
});
</script>
