<template>
  <div class="form">
    <img
      src="/logo.svg"
      alt="logo"
      :class="['logo', headerStore.isDark ? 'white' : null]"
    />
    <ElCard class="inner">
      <ElForm :model="userInfo" label-width="80px">
        <ElFormItem label="ID">
          <ElInput
            autocomplete="username"
            v-model="userInfo.username"
            @keydown="onKeyPress"
          />
        </ElFormItem>
        <ElFormItem label="비밀번호">
          <ElInput
            type="password"
            autocomplete="current-password"
            v-model="userInfo.password"
            @keydown="onKeyPress"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" :loading="isLoggingIn" @click="login"
            >로그인</ElButton
          >
        </ElFormItem>
      </ElForm>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { useHeaderStore } from "@/stores/header";
import { ElMessage } from "element-plus";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const headerStore = useHeaderStore();

const userInfo = ref({
  username: "",
  password: "",
});

const isLoggedIn = await fetch("/api/login")
  .then((res) => res.json())
  .then((res) => res.isLoggedIn);

if (isLoggedIn) {
  router.push({ name: "home" });
}

const isLoggingIn = ref(false);

function onKeyPress(e: Event | KeyboardEvent) {
  if (e instanceof KeyboardEvent && e.key === "Enter") {
    login();
  }
}

async function login() {
  if (isLoggingIn.value) {
    return;
  }
  isLoggingIn.value = true;
  const res = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userInfo.value),
  });

  if (res.status === 200) {
    router.push({ name: "home" });
  } else if (res.status === 401) {
    ElMessage.error("ID나 비밀번호가 일치하지 않습니다.");
  } else if (res.status === 400) {
    ElMessage.error("ID와 비밀번호를 입력해주세요.");
  } else {
    ElMessage.error("알 수 없는 오류로 로그인에 실패했습니다.");
  }
  isLoggingIn.value = false;
}
</script>

<style scoped>
.form {
  max-width: 560px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  row-gap: 2em;
}
.inner {
  width: 100%;
}
</style>
