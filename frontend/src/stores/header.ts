import { ref } from "vue";
import { defineStore } from "pinia";
import { useDark, useToggle } from "@vueuse/core";

// export enum HeaderContent {}

export const useHeaderStore = defineStore("header", () => {
  console.log(window.location);
  const activeIndex = ref(window.location.pathname);
  const isDark = ref(useDark());

  // const toggleDark = useToggle

  // function toggleDark() {

  // }

  return { activeIndex, isDark };
});
