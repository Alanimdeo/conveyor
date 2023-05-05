<template>
  <ElDialog v-model="opened" :title="title">
    <span class="bold">{{ name }}</span>
    <span>을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다!</span>

    <template #footer>
      <ElButton @click="opened = false">취소</ElButton>
      <ElButton type="danger" @click="emit('confirm')" :loading="loading">삭제</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  loading: {
    type: Boolean,
    required: false,
  },
});
const emit = defineEmits(["update:modelValue", "confirm"]);

const opened = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});
</script>

<style scoped>
.bold {
  font-weight: 600;
}
</style>
