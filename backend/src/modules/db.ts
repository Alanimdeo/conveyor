import { existsSync, readdirSync } from "fs";
import { DateTime } from "luxon";
import path from "path";
import semver from "semver";
import sqlite from "sqlite3";

export class Database {
  version: string;
  private db: sqlite.Database;

  constructor(filename: string, create: boolean = false) {
    this.version = getLatestDatabaseVersion();
    if (existsSync(filename)) {
      this.db = new sqlite.Database(filename);
      return;
    }

    if (!create) {
      throw new Error("Database file does not exist.");
    }
    this.db = new sqlite.Database(filename);
  }

  async getWatchDirectoryCount() {
    return await this.get<{
      count: number;
      enabled: number;
    }>("SELECT COUNT(*) AS count, COUNT(CASE WHEN enabled = 1 THEN 1 END) AS enabled FROM watch_directories");
  }

  async getWatchDirectories() {
    const query = await this.all<WatchDirectory[]>("SELECT * FROM watch_directories");
    return query.map(this.booleanizeWatchDirectory);
  }
  async getWatchDirectoryById(id: number) {
    return this.booleanizeWatchDirectory(
      await this.get<WatchDirectory>("SELECT * FROM watch_directories WHERE id=?", [id])
    );
  }
  async getWatchDirectoryByPath(path: string) {
    return this.booleanizeWatchDirectory(
      await this.get<WatchDirectory>("SELECT * FROM watch_directories WHERE path=?", [path])
    );
  }

  booleanizeWatchDirectory(directory: WatchDirectory) {
    if (!directory) {
      return directory;
    }
    directory.enabled = Boolean(directory.enabled);
    directory.recursive = Boolean(directory.recursive);
    directory.usePolling = Boolean(directory.usePolling);
    directory.ignoreDotFiles = Boolean(directory.ignoreDotFiles);
    return directory;
  }

  async getWatchDirectoryPresets() {
    const query = await this.all<WatchDirectoryPreset[]>("SELECT id, name FROM watch_directory_presets");
    return query.map(this.booleanizeWatchDirectoryPreset);
  }
  async getWatchDirectoryPreset(id: number) {
    return this.booleanizeWatchDirectoryPreset(
      await this.get<WatchDirectoryPreset>("SELECT * FROM watch_directory_presets WHERE id=?", [id])
    );
  }

  booleanizeWatchDirectoryPreset(preset: WatchDirectoryPreset) {
    if (!preset) {
      return preset;
    }
    preset.enabled = Boolean(preset.enabled);
    preset.recursive = Boolean(preset.recursive);
    preset.usePolling = Boolean(preset.usePolling);
    preset.ignoreDotFiles = Boolean(preset.ignoreDotFiles);
    return preset;
  }

  async getWatchConditionCount() {
    return await this.get<{
      count: number;
      enabled: number;
    }>("SELECT COUNT(*) AS count, COUNT(CASE WHEN enabled = 1 THEN 1 END) AS enabled FROM watch_conditions");
  }

  async getWatchConditions(directoryId?: number) {
    let sql = "SELECT * FROM watch_conditions";
    if (directoryId) {
      sql += " WHERE directoryId=?";
    }
    const result = await this.all<WatchCondition[]>(sql, [directoryId]);
    return result.map(this.booleanizeWatchCondition);
  }
  async getWatchCondition(id: number) {
    return this.booleanizeWatchCondition(
      await this.get<WatchCondition>("SELECT * FROM watch_conditions WHERE id=?", [id])
    );
  }

  booleanizeWatchCondition(condition: WatchCondition) {
    if (!condition) {
      return condition;
    }
    condition.enabled = Boolean(condition.enabled);
    condition.useRegExp = Boolean(condition.useRegExp);
    if (condition.renamePattern && typeof condition.renamePattern === "string") {
      condition.renamePattern = JSON.parse(condition.renamePattern);
    }
    return condition;
  }

  async getWatchConditionPresets() {
    const query = await this.all<WatchConditionPreset[]>("SELECT id, name FROM watch_condition_presets");
    return query.map(this.booleanizeWatchConditionPreset);
  }
  async getWatchConditionPreset(id: number) {
    return this.booleanizeWatchConditionPreset(
      await this.get<WatchConditionPreset>("SELECT * FROM watch_condition_presets WHERE id=?", [id])
    );
  }

  booleanizeWatchConditionPreset(preset: WatchConditionPreset) {
    if (!preset) {
      return preset;
    }
    preset.enabled = Boolean(preset.enabled);
    preset.useRegExp = Boolean(preset.useRegExp);
    if (preset.renamePattern && typeof preset.renamePattern === "string") {
      preset.renamePattern = JSON.parse(preset.renamePattern);
    }
    return preset;
  }

  async addWatchDirectory(directory: Omit<WatchDirectory, "id">) {
    const existing = await this.getWatchDirectoryByPath(directory.path);
    if (existing) {
      throw new Error(`Watch directory already exists: ${directory.path}`);
    }

    const sql = `INSERT INTO watch_directories (name, enabled, path, recursive, usePolling, interval, ignoreDotFiles) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await this.run(sql, [
      directory.name,
      directory.enabled,
      directory.path,
      directory.recursive,
      directory.usePolling,
      directory.interval || null,
      directory.ignoreDotFiles,
    ]);

    const id = (await this.get<{ id: number }>("SELECT last_insert_rowid() AS id")).id;
    return id;
  }
  async updateWatchDirectory(id: number, directory: Omit<WatchDirectory, "id"> | WatchDirectory) {
    const sql = `UPDATE watch_directories SET name=?, enabled=?, path=?, recursive=?, usePolling=?, interval=?, ignoreDotFiles=? WHERE id=?`;
    await this.run(sql, [
      directory.name,
      directory.enabled,
      directory.path,
      directory.recursive,
      directory.usePolling,
      directory.interval || null,
      directory.ignoreDotFiles,
      id,
    ]);
  }
  async removeWatchDirectory(id: number) {
    await this.run("DELETE FROM watch_directories WHERE id=?", [id]);
  }

  async addWatchDirectoryPreset(preset: Omit<WatchDirectoryPreset, "id">) {
    const sql = `INSERT INTO watch_directory_presets (name, enabled, path, recursive, usePolling, interval, ignoreDotFiles) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await this.run(sql, [
      preset.name,
      preset.enabled,
      preset.path,
      preset.recursive,
      preset.usePolling,
      preset.interval || null,
      preset.ignoreDotFiles,
    ]);
  }
  async updateWatchDirectoryPreset(id: number, preset: Omit<WatchDirectoryPreset, "id"> | WatchDirectoryPreset) {
    const sql = `UPDATE watch_directory_presets SET name=?, enabled=?, path=?, recursive=?, usePolling=?, interval=?, ignoreDotFiles=? WHERE id=?`;
    await this.run(sql, [
      preset.name,
      preset.enabled,
      preset.path,
      preset.recursive,
      preset.usePolling,
      preset.interval || null,
      preset.ignoreDotFiles,
      id,
    ]);
  }
  async removeWatchDirectoryPreset(id: number) {
    await this.run("DELETE FROM watch_directory_presets WHERE id=?", [id]);
  }

  async addWatchCondition(condition: Omit<WatchCondition, "id">) {
    const sql = `INSERT INTO watch_conditions (name, directoryId, enabled, priority, type, useRegExp, pattern, destination, delay, renamePattern) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await this.run(sql, [
      condition.name,
      condition.directoryId,
      condition.enabled,
      condition.priority,
      condition.type,
      condition.useRegExp,
      condition.pattern,
      condition.destination,
      condition.delay,
      condition.renamePattern ? JSON.stringify(condition.renamePattern) : null,
    ]);
  }
  async updateWatchCondition(id: number, condition: Omit<WatchCondition, "id"> | WatchCondition) {
    const sql = `UPDATE watch_conditions SET name=?, directoryId=?, enabled=?, priority=?, type=?, useRegExp=?, pattern=?, destination=?, delay=?, renamePattern=? WHERE id=?`;
    await this.run(sql, [
      condition.name,
      condition.directoryId,
      condition.enabled,
      condition.priority,
      condition.type,
      condition.useRegExp,
      condition.pattern,
      condition.destination,
      condition.delay,
      condition.renamePattern ? JSON.stringify(condition.renamePattern) : null,
      id,
    ]);
  }
  async removeWatchCondition(id: number) {
    await this.run("DELETE FROM watch_conditions WHERE id=?", [id]);
  }

  async addWatchConditionPreset(preset: Omit<WatchConditionPreset, "id">) {
    const sql = `INSERT INTO watch_condition_presets (name, enabled, priority, type, useRegExp, pattern, destination, delay, renamePattern) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await this.run(sql, [
      preset.name,
      preset.enabled,
      preset.priority,
      preset.type,
      preset.useRegExp,
      preset.pattern,
      preset.destination,
      preset.delay,
      preset.renamePattern ? JSON.stringify(preset.renamePattern) : null,
    ]);
  }
  async updateWatchConditionPreset(id: number, preset: Omit<WatchConditionPreset, "id"> | WatchConditionPreset) {
    const sql = `UPDATE watch_condition_presets SET name=?, enabled=?, priority=?, type=?, useRegExp=?, pattern=?, destination=?, delay=?, renamePattern=? WHERE id=?`;
    await this.run(sql, [
      preset.name,
      preset.enabled,
      preset.priority,
      preset.type,
      preset.useRegExp,
      preset.pattern,
      preset.destination,
      preset.delay,
      preset.renamePattern ? JSON.stringify(preset.renamePattern) : null,
      id,
    ]);
  }
  async removeWatchConditionPreset(id: number) {
    await this.run("DELETE FROM watch_condition_presets WHERE id=?", [id]);
  }

  async createLog(log: { directoryId: number; conditionId: number; message: string }) {
    const sql = "INSERT INTO logs(date, directoryId, conditionId, message) VALUES (?, ?, ?, ?)";
    await this.run(sql, [Date.now(), log.directoryId, log.conditionId, log.message]);
  }
  async getLogCount(options?: LogSearchOption) {
    let sql = "SELECT COUNT(*) AS count FROM logs";
    const { option, params, suffix } = this.getLogCondition(options);
    if (option.length) {
      sql += " WHERE ";
      sql += option.join(" AND ");
    }
    sql += " ORDER BY id DESC";
    sql += suffix;

    const { count } = await this.get<{ count: number }>(sql, params);

    return count;
  }
  async getLogs(options?: LogSearchOption, dateFormat?: string) {
    let sql = "SELECT * FROM logs";
    const { option, params, suffix } = this.getLogCondition(options);
    if (option.length) {
      sql += " WHERE ";
      sql += option.join(" AND ");
    }
    sql += " ORDER BY id DESC";
    sql += suffix;

    console.log(sql);

    const result = await this.all<Log[]>(sql, params);
    result.map((log) => {
      if (typeof log.date === "number") {
        log.date = DateTime.fromMillis(log.date).toFormat(dateFormat || "yyyy-MM-dd hh:mm:ss a");
      }
      return log;
    });
    return result;
  }
  private getLogCondition(options?: LogSearchOption) {
    const option: string[] = [];
    const params: any[] = [];
    if (!options) {
      return { option, params };
    }
    if (options.id) {
      option.push("id=?");
      params.push(options.id);
    }
    if (options.directoryId && typeof options.directoryId === "number") {
      option.push("directoryId=?");
      params.push(options.directoryId);
    } else if (typeof options.directoryId === "object") {
      const directoryId = options.directoryId.map(() => "directoryId=?");
      option.push("(" + directoryId.join(" OR ") + ")");
      params.push(...options.directoryId);
    }
    if (options.conditionId && typeof options.conditionId === "number") {
      option.push("conditionId=?");
      params.push(options.conditionId);
    } else if (typeof options.conditionId === "object") {
      const conditionId = options.conditionId.map(() => "conditionId=?");
      option.push("(" + conditionId.join(" OR ") + ")");
      params.push(...options.conditionId);
    }
    if (options.date) {
      option.push("date BETWEEN ? AND ?");
      params.push(options.date.from instanceof Date ? options.date.from.getTime() : options.date.from);
      params.push(options.date.to instanceof Date ? options.date.to.getTime() : options.date.to);
    }

    let suffix = "";
    if (options.limit) {
      suffix += " LIMIT ?";
      params.push(options.limit);
    }
    if (options.offset) {
      suffix += " OFFSET ?";
      params.push(options.offset);
    }
    return { option, params, suffix };
  }

  async getAdminId() {
    const sql = "SELECT value AS id FROM info WHERE key = 'adminId'";
    const result = await this.get<{ id: string }>(sql);
    return result?.id;
  }
  async setAdminId(id: string) {
    const sql = "UPDATE info SET value = ? WHERE key = 'adminId'";
    await this.run(sql, [id]);
  }

  async getAdminPasswordHash() {
    const sql = "SELECT value AS hash FROM info WHERE key = 'adminPasswordHash'";
    const result = await this.get<{ hash: string }>(sql);
    return result?.hash;
  }
  async setAdminPasswordHash(hash: string) {
    const sql = "UPDATE info SET value = ? WHERE key = 'adminPasswordHash'";
    await this.run(sql, [hash]);
  }

  async getSettings() {
    const sql = "SELECT value AS dateFormat FROM info WHERE key = 'dateFormat'";
    const result = await this.get<{ dateFormat: string }>(sql);
    return result;
  }
  async updateSettings(settings: { dateFormat?: string }) {
    if (settings.dateFormat) {
      const sql = "UPDATE info SET value = ? WHERE key = 'dateFormat'";
      await this.run(sql, [settings.dateFormat]);
    }
  }

  async get<T = unknown>(sql: string, params?: any[]) {
    return new Promise<T>((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(row as T);
      });
    });
  }
  async run(sql: string, params?: any[]) {
    return new Promise<Database>((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) {
          reject(err);
        }
        resolve(this);
      });
    });
  }
  async all<T = unknown[]>(sql: string, params?: any[]) {
    return new Promise<T>((resolve, reject) => {
      this.db.all(sql, params, (err, row) => {
        if (err) {
          reject(err);
        }
        resolve(row as unknown as T);
      });
    });
  }
}

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

export function isWatchDirectoryPreset(obj: any): obj is Omit<WatchDirectoryPreset, "id"> {
  return isWatchDirectory(obj);
}

export type WatchCondition = {
  id: number;
  name: string;
  directoryId: number;
  enabled: boolean;
  priority: number;
  type: "file" | "directory" | "all";
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

export function isWatchConditionPreset(obj: any): obj is Omit<WatchConditionPreset, "id"> {
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

export type Log = {
  id: number;
  date: number | string;
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

export const CONVEYOR_DEFAULT_DATABASE_PATH = "/conveyor/config/database.sqlite";

export async function loadDatabase(databasePath: string = CONVEYOR_DEFAULT_DATABASE_PATH, create: boolean = false) {
  const db = new Database(databasePath, create);
  await initializeTables(db);
  return db;
}

async function isTableExists(db: Database, tableName: string) {
  return !!(await db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName]));
}

async function initializeTables(db: Database) {
  for (const table of Object.keys(createTable)) {
    if (!(await isTableExists(db, table))) {
      await createTable[table](db);
    }
  }
  return db;
}

function getLatestDatabaseVersion() {
  return readdirSync(path.join(__dirname, "../alteration/scripts"))
    .map((version) => path.basename(version, ".js"))
    .sort(semver.rcompare)[0];
}

const createTable: {
  [table: string]: (db: Database) => Promise<Database>;
} = {
  info: async (db: Database) => {
    await db.run("CREATE TABLE info (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    await db.run("INSERT INTO info (key, value) VALUES (?, ?)", ["version", getLatestDatabaseVersion()]);
    await db.run("INSERT INTO info (key, value) VALUES (?, ?)", ["adminId", "admin"]);
    await db.run("INSERT INTO info (key, value) VALUES (?, ?)", [
      "adminPasswordHash",
      "$argon2id$v=19$m=65536,t=3,p=4$yLsjeK7Fwc79lwpOcCht2Q$RgL0tVoJR9x3Sq5oxniEtauLNHTNhq99R+AMxeYQyuE",
    ]); // changeme
    await db.run("INSERT INTO info (key, value) VALUES (?, ?)", ["dateFormat", "yyyy-MM-dd hh:mm:ss a"]);
    return db;
  },
  watch_directories: async (db: Database) =>
    await db.run(
      "CREATE TABLE watch_directories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, path TEXT NOT NULL, recursive INTEGER NOT NULL DEFAULT 1, usePolling INTEGER NOT NULL DEFAULT 0, interval INTEGER, ignoreDotFiles INTEGER NOT NULL DEFAULT 1)"
    ),
  watch_directory_presets: async (db: Database) =>
    await db.run(
      "CREATE TABLE watch_directory_presets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, path TEXT NOT NULL, recursive INTEGER NOT NULL DEFAULT 1, usePolling INTEGER NOT NULL DEFAULT 0, interval INTEGER, ignoreDotFiles INTEGER NOT NULL DEFAULT 1)"
    ),
  watch_conditions: async (db: Database) =>
    await db.run(
      "CREATE TABLE watch_conditions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', directoryId INTEGER NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, priority INTEGER NOT NULL DEFAULT 0, type TEXT NOT NULL DEFAULT 'all', useRegExp INTEGER NOT NULL DEFAULT 0, pattern TEXT NOT NULL, destination TEXT NOT NULL, delay INTEGER NOT NULL DEFAULT 0, renamePattern TEXT, FOREIGN KEY(directoryId) REFERENCES watch_directories(id))"
    ),
  watch_condition_presets: async (db: Database) =>
    await db.run(
      "CREATE TABLE watch_condition_presets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, priority INTEGER NOT NULL DEFAULT 0, type TEXT NOT NULL DEFAULT 'all', useRegExp INTEGER NOT NULL DEFAULT 0, pattern TEXT NOT NULL, destination TEXT NOT NULL, delay INTEGER NOT NULL DEFAULT 0, renamePattern TEXT)"
    ),
  logs: async (db: Database) =>
    await db.run(
      "CREATE TABLE logs (id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000), directoryId INTEGER NOT NULL, conditionId INTEGER NOT NULL, message TEXT NOT NULL, FOREIGN KEY(directoryId) REFERENCES watch_directories(id), FOREIGN KEY(conditionId) REFERENCES watch_conditions(id))"
    ),
};
