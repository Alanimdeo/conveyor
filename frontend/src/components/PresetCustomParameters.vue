<template>
  <div class="flex mb gap">
    <ElText>사용자 정의 매개변수</ElText>
    <ElButton type="primary" circle :icon="Plus" @click="addParameter()" />
  </div>
  <div>
    <div
      class="flex gap"
      v-for="(parameter, index) in props.parameters"
      :key="index"
    >
      <ElFormItem label="키">
        <ElInput v-model="parameter.key" />
      </ElFormItem>
      <ElFormItem label="라벨" class="flex-grow">
        <ElInput v-model="parameter.label" />
      </ElFormItem>
      <ElButton
        type="info"
        circle
        :icon="Minus"
        @click="removeParameter(index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from "vue";
import { Plus, Minus } from "@element-plus/icons-vue";
import { canSaveCustomParameters } from "@/utils";
import type { CustomParameter } from "@conveyor/types";

const props = defineProps<{
  modelValue: boolean;
  parameters: CustomParameter[];
}>();

const emit = defineEmits(["update:modelValue"]);

watch(
  () => props.parameters,
  (parameters) => {
    emit("update:modelValue", canSaveCustomParameters(parameters));
  },
  { deep: true }
);

function addParameter() {
  props.parameters.push({ key: "", label: "" });
}

function removeParameter(index: number) {
  props.parameters.splice(index, 1);
}
</script>
