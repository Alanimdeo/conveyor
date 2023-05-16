import { mkdir, rename } from "fs/promises";
import path from "path";
import chokidar from "chokidar";
import type { WatchDirectory } from "@conveyor/types";
import { Database } from "./db";

export const ignoreDotFiles = /(^|[\/\\])\../;

const wait = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function initializeWatcher(watchDirectory: WatchDirectory, db: Database) {
  if (!watchDirectory.enabled) {
    throw new Error("Not enabled.");
  }
  const watchConditions = await db.getWatchConditions(watchDirectory.id);
  if (watchConditions.length === 0 || !watchConditions.some((condition) => condition.enabled)) {
    throw new Error("No active conditions found.");
  }
  const watcher = chokidar.watch(watchDirectory.path, {
    ignored: watchDirectory.ignoreDotFiles ? ignoreDotFiles : undefined,
    ignoreInitial: true,
    persistent: true,
    depth: watchDirectory.recursive ? undefined : 0,
    usePolling: watchDirectory.usePolling,
    interval: watchDirectory.usePolling ? watchDirectory.interval : undefined,
    binaryInterval: watchDirectory.usePolling ? watchDirectory.interval : undefined,
  });

  watcher.on("ready", () => {
    console.log(
      `Watching ${watchDirectory.name !== "" ? watchDirectory.name : "ID " + watchDirectory.id}(${
        watchDirectory.path
      }) for ${watchConditions.length} conditions.`
    );
  });

  watcher.on("add", async (file) => await handleAddEvent(file, "file"));
  watcher.on("addDir", async (file) => await handleAddEvent(file, "directory"));
  watcher.on("change", async (file) => await handleAddEvent(file, "file"));

  async function handleAddEvent(file: string, type: "file" | "directory") {
    const matchedCondition = await getConditionMatch(file, type);
    const originalFilename = path.basename(file);
    let filename = originalFilename;
    if (!matchedCondition) {
      return;
    }
    if (matchedCondition.renamePattern) {
      let extension = "";
      if (matchedCondition.renamePattern.excludeExtension) {
        extension = path.extname(file);
        filename = filename.replace(extension, "");
      }
      const pattern = matchedCondition.renamePattern.useRegExp
        ? new RegExp(matchedCondition.renamePattern.pattern)
        : matchedCondition.renamePattern.pattern;
      filename = filename.replace(pattern, matchedCondition.renamePattern.replaceValue) + extension;
    }

    let logMessage = "";
    if (watchDirectory.path === matchedCondition.destination && filename === originalFilename) {
      logMessage = `Skipping ${originalFilename} as it is already in the destination folder.`;

      console.log(logMessage);
      await db.createLog({
        directoryId: watchDirectory.id,
        conditionId: matchedCondition.id,
        message: logMessage,
      });
      return;
    }
    if (watchDirectory.path === matchedCondition.destination) {
      logMessage = `Renaming ${originalFilename} to ${filename}`;
    } else {
      logMessage = `Moving ${originalFilename} to ${matchedCondition.destination}`;
      if (filename !== originalFilename) {
        logMessage += ` as ${filename}`;
      }
    }

    if (matchedCondition.delay > 0) {
      await wait(matchedCondition.delay);
    }

    await mkdir(matchedCondition.destination, { recursive: true });
    await rename(file, path.join(matchedCondition.destination, filename));

    console.log(logMessage);
    await db.createLog({
      directoryId: watchDirectory.id,
      conditionId: matchedCondition.id,
      message: logMessage,
    });
  }

  async function getConditionMatch(file: string, type: "file" | "directory") {
    const watchConditions = await db.getWatchConditions(watchDirectory.id);
    const filename = path.basename(file);
    const matches = watchConditions
      .filter((condition) => {
        if (!condition.enabled || (condition.type !== "all" && condition.type !== type)) {
          return false;
        }
        if (condition.useRegExp) {
          return new RegExp(condition.pattern).test(filename);
        } else {
          return filename.includes(condition.pattern);
        }
      })
      .sort((a, b) => a.priority - b.priority);
    return matches.length !== 0 ? matches[0] : null;
  }

  return watcher;
}

export async function initializeWatchers(db: Database) {
  const watchers: Record<number, chokidar.FSWatcher> = {};

  const watchDirectories = await db.getWatchDirectories();
  for (const watchDirectory of watchDirectories) {
    try {
      watchers[watchDirectory.id] = await initializeWatcher(watchDirectory, db);
    } catch (err) {
      console.log(`Skipping folder #${watchDirectory.id}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return watchers;
}
