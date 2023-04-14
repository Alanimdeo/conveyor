<template>
  <ElIcon v-if="modelValue">
    <Check />
  </ElIcon>
  <ElIcon v-else>
    <Close />
  </ElIcon>
</template>

<script setup lang="ts">
import { Check, Close } from "@element-plus/icons-vue";

defineProps({
  modelValue: {
    required: true,
  },
});
</script>
