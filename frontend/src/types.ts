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

export type WatchCondition = {
  id: number;
  name: string;
  directoryId: number;
  enabled: boolean;
  priority: number;
  type: WatchType;
  useRegExp: boolean;
  pattern: string;
  destination: string;
  delay: number;
  renamePattern?: RenamePattern;
};

export type WatchConditionPreset = Omit<WatchCondition, "directoryId">;

export enum WatchType {
  All = "all",
  File = "file",
  Directory = "directory",
}

export type RenamePattern = {
  useRegExp: boolean;
  pattern: string;
  replaceValue: string;
  excludeExtension: boolean;
};

export type Log = {
  id: number;
  date: string;
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
