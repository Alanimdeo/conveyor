<template>로그아웃 중입니다.</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

await fetch("/api/logout", {
  method: "POST",
});
document.cookie = "connect.sid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

router.push({ name: "login" });
</script>
