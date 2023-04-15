import { ref } from "vue";
import { defineStore } from "pinia";
import { useDark } from "@vueuse/core";

export const useHeaderStore = defineStore("header", () => {
  const activeIndex = ref(window.location.pathname);
  const isDark = ref(useDark());

  return { activeIndex, isDark };
});
