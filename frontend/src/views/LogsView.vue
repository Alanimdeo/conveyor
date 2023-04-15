<template>
  <!-- <ElTableV2></ElTableV2> -->
  <ElTable :data="logs" v-infinite-scroll="load">
    <ElTableColumn prop="date" label="날짜" fixed="left" width="200" />
    <ElTableColumn prop="directoryId" label="폴더 ID" fixed="left" width="100" />
    <ElTableColumn prop="conditionId" label="조건 ID" fixed="left" width="100" />
    <ElTableColumn prop="message" label="내용" fixed="left" />
  </ElTable>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { Ref } from "vue";
import type { Log, LogSearchOption, WatchCondition, WatchDirectory } from "@/types";

// const watchDirectories: Ref<WatchDirectory[]> = ref([]);
// await fetch("/api/watch-directory")
//   .then(async (res) => {
//     try {
//       return await res.json();
//     } catch (e) {
//       return { error: "서버에서 응답을 받지 못했습니다." };
//     }
//   })
//   .then((res) => {
//     if (res.success) {
//       watchDirectories.value = res;
//     }
//   });

// const watchConditions: Ref<WatchCondition[]> = ref([]);
// await fetch("/api/watch-condition")
//   .then(async (res) => {
//     try {
//       return await res.json();
//     } catch (e) {
//       return { error: "서버에서 응답을 받지 못했습니다." };
//     }
//   })
//   .then((res) => {
//     if (res.success) {
//       watchConditions.value = res;
//     }
//   });

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

const logs: Ref<Log[]> = ref([]);

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
        console.log(res);
        res = res.filter((log: Log) => !logs.value.some((l) => l.id === log.id));
        console.log(res);
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
