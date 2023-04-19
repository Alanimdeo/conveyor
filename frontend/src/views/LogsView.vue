<template>
  <div class="top-bar">
    <div>
      <ElSelect v-model="logSearchOption.directoryId" multiple placeholder="폴더를 선택하세요.">
        <ElOption
          v-for="directory in watchDirectories"
          :key="directory.id"
          :label="directory.name"
          :value="directory.id"
        />
      </ElSelect>
    </div>
    <div>
      <ElSelect v-model="logSearchOption.conditionId" multiple placeholder="조건을 선택하세요.">
        <ElOption
          v-for="(condition, index) in watchConditions.filter((c) =>
            logSearchOption.directoryId?.includes(c.directoryId)
          )"
          :key="condition.id"
          :label="`${watchDirectories.find((d) => d.id == condition.directoryId)?.name} - ${
            condition.name || '조건 ' + (index + 1)
          }`"
          :value="condition.id"
        />
      </ElSelect>
    </div>
    <div>
      <ElDatePicker
        v-model="logSearchDate"
        type="datetimerange"
        range-separator="~"
        start-placeholder="시작"
        end-placeholder="끝"
        :shortcuts="logDatePreset"
      />
    </div>
    <div>
      <ElSwitch class="switch" v-model="logAutoRefresh" inactive-text="자동 새로고침" />
    </div>
  </div>
  <ElTable :data="logs" table-layout="auto">
    <ElTableColumn prop="date" label="날짜" width="200" />
    <ElTableColumn prop="directoryName" label="폴더" />
    <ElTableColumn prop="conditionName" label="감시 조건" />
    <ElTableColumn prop="message" label="내용" />
  </ElTable>
  <ElPagination
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :page-sizes="[20, 50, 100, 200]"
    layout="sizes, prev, pager, next, jumper"
    :total="logCount"
    @size-change="load()"
    @current-change="load()"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { Ref } from "vue";
import type { Log, LogSearchOption, WatchCondition, WatchDirectory } from "@/types";

const watchDirectories: Ref<WatchDirectory[]> = ref([]);
await fetch("/api/watch-directory")
  .then(async (res) => {
    try {
      return await res.json();
    } catch (e) {
      return { error: "서버에서 응답을 받지 못했습니다." };
    }
  })
  .then((res) => {
    if (!res.error) {
      watchDirectories.value = res;
    }
  });

const watchConditions: Ref<WatchCondition[]> = ref([]);
await fetch("/api/watch-condition")
  .then(async (res) => {
    try {
      return await res.json();
    } catch (e) {
      return { error: "서버에서 응답을 받지 못했습니다." };
    }
  })
  .then((res) => {
    if (!res.error) {
      watchConditions.value = res;
    }
  });

const logSearchOption: Ref<LogSearchOption> = ref({
  conditionId: [],
  directoryId: [],
});

const logDatePreset = [
  {
    text: "오늘",
    value: () => {
      const from = new Date();
      const to = new Date();
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      return [from, to];
    },
  },
  {
    text: "지난 7일",
    value: () => {
      const from = new Date();
      const to = new Date();
      from.setDate(from.getDate() - 7);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      return [from, to];
    },
  },
  {
    text: "지난 30일",
    value: () => {
      const from = new Date();
      const to = new Date();
      from.setDate(from.getDate() - 30);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      return [from, to];
    },
  },
  {
    text: "이번 달",
    value: () => {
      const from = new Date();
      const to = new Date();
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      to.setMonth(to.getMonth() + 1);
      to.setDate(0);
      to.setHours(23, 59, 59, 999);
      return [from, to];
    },
  },
  {
    text: "지난 달",
    value: () => {
      const from = new Date();
      const to = new Date();
      from.setMonth(from.getMonth() - 1);
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      to.setDate(0);
      to.setHours(23, 59, 59, 999);
      return [from, to];
    },
  },
];

const from = new Date();
const to = new Date();
from.setDate(from.getDate() - 7);
from.setHours(0, 0, 0, 0);
to.setHours(23, 59, 59, 999);

const logSearchDate = ref<[Date, Date]>([from, to]);

const logAutoRefresh = ref(false);
setInterval(async () => {
  if (logAutoRefresh.value) {
    await load();
  }
}, 5000);

watch(
  () => logSearchOption.value.directoryId,
  async () => {
    logSearchOption.value.conditionId = logSearchOption.value.conditionId?.filter((id) =>
      logSearchOption.value.directoryId?.includes(watchConditions.value.find((c) => c.id === id)?.directoryId ?? 0)
    );
  }
);
watch(
  () => [logSearchOption.value.conditionId, logSearchDate.value],
  async () => await load()
);

const logCount = ref(0);

async function getLogCount(options?: LogSearchOption) {
  await fetch("/api/log/count", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: options ? JSON.stringify(options) : undefined,
  })
    .then(async (res) => {
      try {
        return await res.json();
      } catch (e) {
        return { error: "서버에서 응답을 받지 못했습니다." };
      }
    })
    .then((res) => {
      if (!res.error) {
        logCount.value = res.count;
      }
    });
}

type LogWithName = {
  id: number;
  date: string;
  directoryId: number;
  directoryName: string;
  conditionId: number;
  conditionName: string;
  message: string;
};

const logs: Ref<LogWithName[]> = ref([]);

const pageSize = ref(20);
const currentPage = ref(1);

async function load() {
  const option: LogSearchOption = {
    date: {
      from: logSearchDate.value[0].getTime(),
      to: logSearchDate.value[1].getTime(),
    },
  };
  if (logSearchOption.value.directoryId?.length) {
    option.directoryId = logSearchOption.value.directoryId;
  }
  if (logSearchOption.value.conditionId?.length) {
    option.conditionId = logSearchOption.value.conditionId;
  }
  await getLogCount(option);
  await fetch("/api/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...option,
      offset: (currentPage.value - 1) * pageSize.value,
      limit: pageSize.value,
    }),
  })
    .then(async (res) => {
      try {
        return await res.json();
      } catch (e) {
        return { error: "서버에서 응답을 받지 못했습니다." };
      }
    })
    .then((res) => {
      if (!res.error) {
        res = res.map((log: Log) => {
          const directory = watchDirectories.value.find((d) => d.id === log.directoryId);
          const condition = watchConditions.value.find((c) => c.id === log.conditionId);
          return {
            ...log,
            directoryName: (directory?.name || (directory?.id ? "ID " + directory.id : null)) ?? "삭제된 폴더",
            conditionName: (condition?.name || (condition?.id ? "ID " + condition.id : null)) ?? "삭제된 조건",
          };
        });
        logs.value = res;
      }
    });
}

await load();
</script>

<style>
.el-pagination {
  justify-content: space-between;
}
.el-switch__label {
  font-weight: unset !important;
}
.el-switch__label.is-active {
  color: var(--el-text-color-primary);
}
</style>

<style scoped>
.top-bar {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
  align-items: center;
  gap: 1rem;
}
</style>
