<template>
  <ElIcon>
    <Check v-if="modelValue" />
    <Close v-else />
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
