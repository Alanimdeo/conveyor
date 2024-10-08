<template>
  <ElHeader>
    <ElMenu
      :default-active="activeIndex"
      mode="horizontal"
      :ellipsis="false"
      router
    >
      <div class="logo" @click="router.push('/')">
        <img
          src="/logo.svg"
          alt="logo"
          :class="['logo-img', headerStore.isDark ? 'white' : null]"
        />
        <p class="logo-title">Conveyor</p>
      </div>

      <ElMenuItem index="/">홈</ElMenuItem>
      <ElMenuItem index="/directory">폴더</ElMenuItem>
      <ElMenuItem index="/preset">프리셋</ElMenuItem>
      <ElMenuItem index="/logs">로그</ElMenuItem>
      <div class="flex-grow" />

      <div class="after">
        <ElIcon class="button" :size="20" @click="settingsDialog = true">
          <Setting />
        </ElIcon>
        <ElIcon
          class="button"
          :size="20"
          @click="router.push({ name: 'logout' })"
        >
          <SwitchButton />
        </ElIcon>
      </div>
    </ElMenu>
  </ElHeader>

  <ElDialog class="settings" v-model="settingsDialog" title="설정">
    <div>
      <p>테마</p>
      <ElSwitch
        v-model="headerStore.isDark"
        size="large"
        inline-prompt
        :active-icon="Moon"
        :inactive-icon="Sunny"
        style="--el-switch-on-color: #303030; --el-switch-off-color: #8d9095"
      />
    </div>
    <div>
      <p>로그 날짜 표시 형식</p>
      <ElAlert
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 10px"
      >
        <span>
          날짜 포맷은
          <a
            href="https://moment.github.io/luxon/index.html#/formatting?id=table-of-tokens"
            target="_blank"
            >이곳</a
          >을 참고하세요.
        </span>
      </ElAlert>
      <ElInput v-model="logDateFormat" placeholder="yyyy-MM-dd hh:mm:ss a" />
    </div>
    <div>
      <p>계정</p>
      <ElForm>
        <ElFormItem label="ID">
          <ElInput v-model="username" />
        </ElFormItem>
        <ElFormItem label="기존 비밀번호">
          <ElInput
            type="password"
            autocomplete="current-password"
            v-model="password"
          />
        </ElFormItem>
        <ElFormItem label="새 비밀번호">
          <ElInput
            type="password"
            autocomplete="new-password"
            v-model="newPassword"
          />
        </ElFormItem>
        <ElFormItem label="새 비밀번호 확인">
          <ElInput
            type="password"
            autocomplete="new-password"
            v-model="newPasswordConfirm"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton
            type="primary"
            @click="changeUserInfo()"
            :disabled="
              !username ||
              !password ||
              (newPassword ? newPassword !== newPasswordConfirm : false)
            "
          >
            저장
          </ElButton>
        </ElFormItem>
      </ElForm>
    </div>
    <template #footer>
      <ElButton @click="settingsDialog = false">닫기</ElButton>
      <ElButton
        type="primary"
        @click="saveSettings()"
        :loading="savingSettings"
        :disabled="logDateFormat === logDateFormatInitial"
      >
        저장
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Moon, Sunny, SwitchButton, Setting } from "@element-plus/icons-vue";
import { useHeaderStore } from "@/stores/header";

const router = useRouter();

const headerStore = useHeaderStore();

const activeIndex = computed(() => headerStore.activeIndex);

const settingsDialog = ref(false);
const savingSettings = ref(false);
const logDateFormatInitial = ref("");
const logDateFormat = ref("");
const usernameInitial = ref("");
const username = ref("");
const password = ref("");
const newPassword = ref("");
const newPasswordConfirm = ref("");

const loadSettings = async () =>
  await fetch("/api/settings")
    .then((res) => res.json())
    .then((res) => {
      logDateFormat.value = res.dateFormat;
      logDateFormatInitial.value = res.dateFormat;
    });

watch(settingsDialog, (value) => {
  if (value) {
    loadSettings();
  }
});

await fetch("/api/user")
  .then((res) => res.json())
  .then((res) => {
    username.value = res.username;
    usernameInitial.value = res.username;
  });

async function saveSettings() {
  if (logDateFormat.value === logDateFormatInitial.value) {
    ElMessage.error("변경할 내용이 없습니다.");
    return;
  }
  savingSettings.value = true;
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dateFormat: logDateFormat.value,
    }),
  });

  if (res.status === 200) {
    ElMessage.success("저장되었습니다.");
    logDateFormatInitial.value = logDateFormat.value;
    settingsDialog.value = false;
  } else {
    ElMessage.error("알 수 없는 오류가 발생했습니다.");
  }
  savingSettings.value = false;
}

async function changeUserInfo() {
  const userInfo: {
    username?: string;
    password?: string;
    newPassword?: string;
  } = {};
  if (!username.value) {
    ElMessage.error("ID를 입력해주세요.");
    return;
  }
  if (username.value !== usernameInitial.value) {
    userInfo.username = username.value;
  }

  if (!password.value) {
    ElMessage.error("기존 비밀번호를 입력해주세요.");
    return;
  }
  userInfo.password = password.value;

  if (!userInfo.username && !newPassword.value) {
    ElMessage.error("변경할 내용이 없습니다.");
    return;
  }
  if (newPassword.value && newPassword.value !== newPasswordConfirm.value) {
    ElMessage.error("새 비밀번호가 일치하지 않습니다.");
    return;
  }
  if (newPassword.value) {
    userInfo.newPassword = newPassword.value;
  }

  const res = await fetch("/api/user", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userInfo),
  });

  if (res.status === 200) {
    ElMessage.success("변경되었습니다.");
  } else if (res.status === 403) {
    ElMessage.error("기존 비밀번호가 일치하지 않습니다.");
  } else {
    ElMessage.error("알 수 없는 오류가 발생했습니다.");
  }
}

await loadSettings();
</script>

<style scoped>
.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  cursor: pointer;
}
.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 0.4em;
}
.logo-title {
  font-weight: 600;
  margin: 0;
  margin-bottom: 0.4em;
}
@media (max-width: 480px) {
  .logo-title {
    display: none;
  }
}
.button {
  cursor: pointer;
}
</style>

<style>
.settings > .el-dialog__body {
  padding-top: 0;
  padding-bottom: 0;
}
</style>
