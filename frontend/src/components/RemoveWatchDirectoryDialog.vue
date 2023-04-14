<template>
  <ElDialog v-model="opened" title="폴더 삭제">
    <span class="bold">폴더 #{{ directoryId }}</span>
    <span>을(를) 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다!</span>

    <template #footer>
      <ElButton @click="opened = false">취소</ElButton>
      <ElButton type="danger" @click="removeDirectory(directoryId)" :loading="removingDirectory">삭제</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { computed, h, ref } from "vue";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  directoryId: {
    type: Number,
    required: true,
  },
});
const emit = defineEmits(["update:modelValue", "removed"]);

const opened = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const removingDirectory = ref(false);

async function removeDirectory(id: number) {
  removingDirectory.value = true;
  const request = await fetch("/api/watch-directory/" + id, {
    method: "DELETE",
  }).then((res) => res.json());
  opened.value = false;
  removingDirectory.value = false;
  if (request.success) {
    ElMessage.success("폴더를 삭제했습니다.");
  } else {
    ElMessage.error(h("div", null, [h("p", null, "폴더를 삭제하지 못했습니다."), h("p", null, request.error)]));
  }
  emit("removed", id);
}
</script>

<style scoped>
.bold {
  font-weight: 600;
}
</style>
