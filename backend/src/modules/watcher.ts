import { mkdirSync, renameSync, statSync } from "fs";
import { homedir } from "os";
import path from "path";
import chokidar from "chokidar";
import type { WatchDirectory } from "@conveyor/types";
import { Database } from "./db";

export const ignoreDotFiles = /(^|[\/\\])\../;

export function initializeWatcher(
  watchDirectory: WatchDirectory,
  db: Database
) {
  if (!watchDirectory.enabled) {
    throw new Error("Not enabled.");
  }

  const homeDirectory = homedir();
  watchDirectory.path = watchDirectory.path.replace("~", homeDirectory);

  const watchConditions = db.getWatchConditions(watchDirectory.id);
  if (
    watchConditions.length === 0 ||
    !watchConditions.some((condition) => condition.enabled)
  ) {
    throw new Error("No active conditions found.");
  }
  const watcher = chokidar.watch(watchDirectory.path, {
    ignored: watchDirectory.ignoreDotFiles ? ignoreDotFiles : undefined,
    ignoreInitial: true,
    persistent: true,
    depth: watchDirectory.recursive ? undefined : 0,
    usePolling: watchDirectory.usePolling,
    interval: watchDirectory.usePolling ? watchDirectory.interval : undefined,
    binaryInterval: watchDirectory.usePolling
      ? watchDirectory.interval
      : undefined,
  });

  watcher.on("ready", () => {
    console.log(
      `Watching ${watchDirectory.name !== "" ? watchDirectory.name : "ID " + watchDirectory.id}(${
        watchDirectory.path
      }) for ${watchConditions.length} conditions.`
    );
  });

  watcher.on("add", (file) => handleAddEvent(file, "file"));
  watcher.on("addDir", (file) => handleAddEvent(file, "directory"));
  watcher.on("change", (file) => handleAddEvent(file, "file"));

  const handling = new Set<string>();

  function handleAddEvent(file: string, type: "file" | "directory") {
    if (handling.has(file)) {
      return;
    }
    file = file.normalize();
    handling.add(file);
    const matchedCondition = getConditionMatch(file, type);
    if (!matchedCondition) {
      return;
    }

    let interval: NodeJS.Timer | undefined;

    interval = waitForUnchangingFileSize(file, (success: boolean) => {
      if (interval) {
        clearTimeout(interval);
      }
      if (!success) {
        handling.delete(file);
        return;
      }
      matchedCondition.destination = matchedCondition?.destination.replace(
        "~",
        homeDirectory
      );

      const originalFilename = path.basename(file);
      let filename = originalFilename;
      if (matchedCondition.renamePattern) {
        let extension = "";
        if (matchedCondition.renamePattern.excludeExtension) {
          extension = path.extname(file);
          filename = filename.replace(extension, "");
        }
        const pattern = matchedCondition.renamePattern.useRegExp
          ? new RegExp(matchedCondition.renamePattern.pattern)
          : matchedCondition.renamePattern.pattern;
        filename =
          filename.replace(
            pattern,
            matchedCondition.renamePattern.replaceValue
          ) + extension;
      }

      let logMessage = "";
      if (
        (watchDirectory.path === "$" ||
          watchDirectory.path === matchedCondition.destination) &&
        filename === originalFilename
      ) {
        logMessage = `Skipping ${originalFilename} as it is already in the destination folder.`;

        console.log(logMessage);
        db.createLog({
          directoryId: watchDirectory.id,
          conditionId: matchedCondition.id,
          message: logMessage,
        });
        return;
      }
      if (
        matchedCondition.destination === "$" ||
        watchDirectory.path === matchedCondition.destination
      ) {
        logMessage = `Renaming ${originalFilename} to ${filename}`;
      } else {
        logMessage = `Moving ${originalFilename} to ${matchedCondition.destination}`;
        if (filename !== originalFilename) {
          logMessage += ` as ${filename}`;
        }
      }

      const destination =
        matchedCondition.destination === "$"
          ? watchDirectory.path
          : matchedCondition.destination;

      setTimeout(move, matchedCondition.delay);

      function move() {
        try {
          mkdirSync(destination, { recursive: true });
          renameSync(file, path.join(destination, filename));
        } catch (err) {
          logMessage = `Error moving ${originalFilename} to ${destination}: ${
            err instanceof Error ? err.message : err
          }`;
        }

        console.log(logMessage);
        db.createLog({
          directoryId: watchDirectory.id,
          conditionId: matchedCondition!.id,
          message: logMessage,
        });
        handling.delete(file);
      }
    });
  }

  function waitForUnchangingFileSize(
    file: string,
    callback: (success: boolean) => void
  ) {
    let lastSize = statSync(file).size;
    function check() {
      try {
        const stat = statSync(file);
        if (stat.size !== 0 && stat.size === lastSize) {
          callback(true);
        } else {
          lastSize = stat.size;
        }
      } catch (err) {
        callback(false);
      }
    }

    const interval = setInterval(check, 1000);
    return interval;
  }

  function getConditionMatch(file: string, type: "file" | "directory") {
    const watchConditions = db.getWatchConditions(watchDirectory.id, {
      enabledOnly: true,
    });
    const filename = path.basename(file);
    const matches = watchConditions
      .filter((condition) => {
        if (condition.type !== "all" && condition.type !== type) {
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

export function initializeWatchers(db: Database) {
  const watchers: Record<number, chokidar.FSWatcher> = {};

  const watchDirectories = db.getWatchDirectories();
  for (const watchDirectory of watchDirectories) {
    try {
      watchers[watchDirectory.id] = initializeWatcher(watchDirectory, db);
    } catch (err) {
      console.log(
        `Skipping folder #${watchDirectory.id}: ${err instanceof Error ? err.message : err}`
      );
    }
  }

  return watchers;
}
