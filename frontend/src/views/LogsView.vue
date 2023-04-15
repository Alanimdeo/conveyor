<template>
  <ElTable :data="logs" v-infinite-scroll="load" table-layout="auto">
    <ElTableColumn prop="date" label="날짜" />
    <ElTableColumn prop="directoryName" label="폴더" />
    <ElTableColumn prop="conditionName" label="감시" />
    <ElTableColumn prop="message" label="내용" />
  </ElTable>
</template>

<script setup lang="ts">
import { ref } from "vue";
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

const logSearchOption: Ref<LogSearchOption> = ref({});

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

async function load() {
  if (logs.value.length >= logCount.value) return;
  await fetch("/api/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...logSearchOption.value,
      offset: logs.value.length,
      limit: 20,
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
        res = res.filter((log: Log) => !logs.value.some((l) => l.id === log.id));
        res = res.map((log: Log) => {
          const directory = watchDirectories.value.find((d) => d.id === log.directoryId);
          const condition = watchConditions.value.find((c) => c.id === log.conditionId);
          return {
            ...log,
            directoryName: (directory?.name || (directory?.id ? "ID " + directory.id : null)) ?? "삭제된 폴더",
            conditionName: (condition?.name || (condition?.id ? "ID " + condition.id : null)) ?? "삭제된 조건",
          };
        });
        logs.value.push(...res);
      }
    });
}

await getLogCount();

// const columns: Column<any>[] = [
//   {
//     key: "date",
//     title: "날짜",
//     dataKey: "date",
//     width: 150,
//     fixed: TableV2FixedDir.LEFT,
//     cellRenderer: ({ cellData: date }) => <span>{{ date }}</span>,
//   },
//   {
//     key: "directoryId",
//     title: "폴더 ID",
//     dataKey: "directoryId",
//     width: 150,
//     fixed: TableV2FixedDir.LEFT,
//     cellRenderer: ({ cellData: directoryId }) => <span>{{ directoryId }}</span>,
//   },
//   {
//     key: "conditionId",
//     title: "조건 ID",
//     dataKey: "conditionId",
//     width: 150,
//     fixed: TableV2FixedDir.LEFT,
//     cellRenderer: ({ cellData: conditionId }) => <span>{{ conditionId }}</span>,
//   },
// ];
</script>
