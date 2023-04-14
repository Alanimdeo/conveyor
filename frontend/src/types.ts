export type WatchDirectory = {
  id: number;
  enabled: boolean;
  path: string;
  recursive: boolean;
  usePolling: boolean;
  interval?: number;
  ignoreDotFiles: boolean;
};

export type WatchCondition = {
  id: number;
  directoryId: number;
  enabled: boolean;
  type: WatchType;
  useRegExp: boolean;
  pattern: string;
  destination: string;
  renamePattern?: RenamePattern;
};

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
  time: string;
  directoryId: number;
  conditionId: number;
  message: string;
};

export type LogSearchOption = {
  id?: number;
  limit?: number;
  date?: {
    from: Date;
    to: Date;
  };
  directoryId?: number;
  conditionId?: number;
};
