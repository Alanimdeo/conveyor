export type WatchDirectory = {
  id: number;
  name: string;
  enabled: boolean;
  path: string;
  recursive: boolean;
  usePolling: boolean;
  interval?: number;
  ignoreDotFiles: boolean;
};

export type WatchDirectoryPreset = WatchDirectory;

export function isWatchDirectory(obj: any): obj is Omit<WatchDirectory, "id"> {
  return (
    typeof obj.enabled === "boolean" &&
    typeof obj.name === "string" &&
    typeof obj.path === "string" &&
    typeof obj.recursive === "boolean" &&
    typeof obj.usePolling === "boolean" &&
    (obj.interval === undefined || typeof obj.interval === "number") &&
    typeof obj.ignoreDotFiles === "boolean"
  );
}

export function isWatchDirectoryPreset(
  obj: any
): obj is Omit<WatchDirectoryPreset, "id"> {
  return isWatchDirectory(obj);
}

export type WatchCondition = {
  id: number;
  name: string;
  directoryId: number;
  enabled: boolean;
  priority: number;
  type: "all" | "file" | "directory";
  useRegExp: boolean;
  pattern: string;
  destination: string;
  delay: number;
  renamePattern?: RenamePattern;
};

export type WatchConditionPreset = Omit<WatchCondition, "directoryId">;

export function isWatchCondition(obj: any): obj is Omit<WatchCondition, "id"> {
  return (
    typeof obj.directoryId === "number" &&
    typeof obj.name === "string" &&
    typeof obj.enabled === "boolean" &&
    typeof obj.priority === "number" &&
    (obj.type === "file" || obj.type === "directory" || obj.type === "all") &&
    typeof obj.useRegExp === "boolean" &&
    typeof obj.pattern === "string" &&
    typeof obj.destination === "string" &&
    typeof obj.delay === "number" &&
    (obj.renamePattern === undefined || isRenamePattern(obj.renamePattern))
  );
}

export function isWatchConditionPreset(
  obj: any
): obj is Omit<WatchConditionPreset, "id"> {
  return (
    typeof obj.name === "string" &&
    typeof obj.enabled === "boolean" &&
    typeof obj.priority === "number" &&
    (obj.type === "file" || obj.type === "directory" || obj.type === "all") &&
    typeof obj.useRegExp === "boolean" &&
    typeof obj.pattern === "string" &&
    typeof obj.destination === "string" &&
    typeof obj.delay === "number" &&
    (obj.renamePattern === undefined || isRenamePattern(obj.renamePattern))
  );
}

export type RenamePattern = {
  useRegExp: boolean;
  pattern: string;
  replaceValue: string;
  excludeExtension: boolean;
};

export function isRenamePattern(obj: any): obj is RenamePattern {
  return (
    typeof obj.useRegExp === "boolean" &&
    typeof obj.pattern === "string" &&
    typeof obj.replaceValue === "string" &&
    typeof obj.excludeExtension === "boolean"
  );
}

export type Log<DateType = number | string> = {
  id: number;
  date: DateType;
  directoryId: number;
  conditionId: number;
  message: string;
};

export type LogSearchOption = {
  id?: number;
  limit?: number;
  offset?: number;
  date?: {
    from: Date | number;
    to: Date | number;
  };
  directoryId?: number[];
  conditionId?: number[];
};
