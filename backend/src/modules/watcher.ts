import chokidar from "chokidar";
import type { Database, WatchDirectory } from "./db";
import path from "path";
import { mkdir, rename } from "fs/promises";

export const ignoreDotFiles = /(^|[\/\\])\../;

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
    cwd: watchDirectory.path,
    usePolling: watchDirectory.usePolling,
    interval: watchDirectory.usePolling ? watchDirectory.interval : undefined,
    binaryInterval: watchDirectory.usePolling ? watchDirectory.interval : undefined,
  });

  watcher.on("ready", () => {
    console.log(
      `Watching folder #${watchDirectory.id}(${watchDirectory.path}) for ${watchConditions.length} conditions.`
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
    console.log(
      `Moving ${originalFilename} to ${matchedCondition.destination}` +
        (filename !== originalFilename ? ` as ${filename}` : "")
    );

    await mkdir(matchedCondition.destination, { recursive: true });
    await rename(file, path.join(matchedCondition.destination, filename));
    // if (type === "file") {
    // } else {
    //   await mkdir(matchedCondition.destination, { recursive: true });
    // }
  }

  async function getConditionMatch(file: string, type: "file" | "directory") {
    const watchConditions = await db.getWatchConditions(watchDirectory.id);
    const filename = path.basename(file);
    const matches = watchConditions.filter((condition) => {
      if (!condition.enabled || (condition.type !== "all" && condition.type !== type)) {
        return false;
      }
      if (condition.useRegExp) {
        return new RegExp(condition.pattern).test(filename);
      } else {
        return filename.includes(condition.pattern);
      }
    });
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
