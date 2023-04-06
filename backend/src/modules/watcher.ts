import chokidar from "chokidar";
import { Database } from "./db";
import path from "path";
import { rename } from "fs/promises";

export const ignoreDotFiles = /(^|[\/\\])\../;

export async function initializeWatchers(db: Database) {
  const watchers: Record<number, chokidar.FSWatcher> = {};

  const watchDirectories = await db.getWatchDirectories();
  for (const watchDirectory of watchDirectories) {
    const watchConditions = await db.getWatchConditions(watchDirectory.id);
    watchers[watchDirectory.id] = chokidar.watch(watchDirectory.path, {
      ignored: watchDirectory.ignoreDotFiles ? ignoreDotFiles : undefined,
      ignoreInitial: true,
      persistent: true,
      depth: watchDirectory.recursive ? undefined : 0,
      usePolling: watchDirectory.usePolling,
      interval: watchDirectory.usePolling ? watchDirectory.interval : undefined,
      binaryInterval: watchDirectory.usePolling ? watchDirectory.interval : undefined,
    });
    const watcher = watchers[watchDirectory.id];

    watcher.on("ready", () => {
      console.log(`Watching ${watchDirectory.path} for ${watchConditions.length} conditions.`);
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
      await rename(file, path.join(matchedCondition.destination, filename));
    }

    async function getConditionMatch(file: string, type: "file" | "directory") {
      const filename = path.basename(file);
      const matches = watchConditions.filter((condition) => {
        if (condition.type !== "all" && condition.type !== type) {
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
  }

  return watchers;
}
