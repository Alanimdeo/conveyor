import { existsSync, readdirSync } from "fs";
import path from "path";
import SqliteDatabase from "better-sqlite3";
import type { Database as SqliteDatabaseType } from "better-sqlite3";
import semver from "semver";
import { DateTime } from "luxon";
import type {
  Log,
  LogSearchOption,
  WatchCondition,
  WatchConditionPreset,
  WatchDirectory,
  WatchDirectoryPreset,
} from "@conveyor/types";
import { getVersion } from "../alteration";

export class Database {
  version: string;
  db: SqliteDatabaseType;

  constructor(filename: string, create: boolean = false) {
    this.version = getLatestDatabaseVersion();
    if (existsSync(filename)) {
      this.db = new SqliteDatabase(filename);
      this.db.pragma("journal_mode = WAL");
      return;
    }

    if (!create) {
      throw new Error("Database file does not exist.");
    }
    this.db = new SqliteDatabase(filename);
  }

  getWatchDirectoryCount() {
    return this.get<{
      count: number;
      enabled: number;
    }>("SELECT COUNT(*) AS count, COUNT(CASE WHEN enabled = 1 THEN 1 END) AS enabled FROM watch_directories");
  }

  getWatchDirectories() {
    const query = this.all<WatchDirectory[]>("SELECT * FROM watch_directories");
    return query.map(this.booleanizeWatchDirectory);
  }
  getWatchDirectoryById(id: number) {
    return this.booleanizeWatchDirectory(this.get<WatchDirectory>("SELECT * FROM watch_directories WHERE id=?", [id]));
  }
  getWatchDirectoryByPath(path: string) {
    return this.booleanizeWatchDirectory(
      this.get<WatchDirectory>("SELECT * FROM watch_directories WHERE path=?", [path])
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

  getWatchDirectoryPresets() {
    const query = this.all<WatchDirectoryPreset[]>("SELECT id, name FROM watch_directory_presets");
    return query.map(this.booleanizeWatchDirectoryPreset);
  }
  getWatchDirectoryPreset(id: number) {
    return this.booleanizeWatchDirectoryPreset(
      this.get<WatchDirectoryPreset>("SELECT * FROM watch_directory_presets WHERE id=?", [id])
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

  getWatchConditionCount() {
    return this.get<{
      count: number;
      enabled: number;
    }>("SELECT COUNT(*) AS count, COUNT(CASE WHEN enabled = 1 THEN 1 END) AS enabled FROM watch_conditions");
  }

  getWatchConditions(directoryId?: number, options?: { enabledOnly?: boolean }) {
    let sql = "SELECT * FROM watch_conditions";
    const conditions: string[] = [];
    if (directoryId) {
      conditions.push("directoryId=?");
    }
    if (options?.enabledOnly) {
      conditions.push("enabled=1");
    }
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }
    const params = directoryId ? [directoryId] : [];
    const result = this.all<WatchCondition[]>(sql, params);
    return result.map(this.booleanizeWatchCondition);
  }
  getWatchCondition(id: number) {
    return this.booleanizeWatchCondition(this.get<WatchCondition>("SELECT * FROM watch_conditions WHERE id=?", [id]));
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

  getWatchConditionPresets() {
    const query = this.all<WatchConditionPreset[]>("SELECT id, name FROM watch_condition_presets");
    return query.map(this.booleanizeWatchConditionPreset);
  }
  getWatchConditionPreset(id: number) {
    return this.booleanizeWatchConditionPreset(
      this.get<WatchConditionPreset>("SELECT * FROM watch_condition_presets WHERE id=?", [id])
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

  addWatchDirectory(directory: Omit<WatchDirectory, "id">) {
    const existing = this.getWatchDirectoryByPath(directory.path);
    if (existing) {
      throw new Error(`Watch directory already exists: ${directory.path}`);
    }

    const sql = `INSERT INTO watch_directories (name, enabled, path, recursive, usePolling, interval, ignoreDotFiles) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    this.run(sql, [
      directory.name,
      directory.enabled,
      directory.path.normalize,
      directory.recursive,
      directory.usePolling,
      directory.interval || null,
      directory.ignoreDotFiles,
    ]);

    const id = this.get<{ id: number }>("SELECT last_insert_rowid() AS id").id;
    return id;
  }
  updateWatchDirectory(id: number, directory: Omit<WatchDirectory, "id"> | WatchDirectory) {
    const sql = `UPDATE watch_directories SET name=?, enabled=?, path=?, recursive=?, usePolling=?, interval=?, ignoreDotFiles=? WHERE id=?`;
    this.run(sql, [
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
  removeWatchDirectory(id: number) {
    this.run("DELETE FROM watch_conditions WHERE directoryId=?", [id]);
    this.run("DELETE FROM watch_directories WHERE id=?", [id]);
  }

  addWatchDirectoryPreset(preset: Omit<WatchDirectoryPreset, "id">) {
    const sql = `INSERT INTO watch_directory_presets (name, enabled, path, recursive, usePolling, interval, ignoreDotFiles) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    this.run(sql, [
      preset.name,
      preset.enabled,
      preset.path,
      preset.recursive,
      preset.usePolling,
      preset.interval || null,
      preset.ignoreDotFiles,
    ]);
  }
  updateWatchDirectoryPreset(id: number, preset: Omit<WatchDirectoryPreset, "id"> | WatchDirectoryPreset) {
    const sql = `UPDATE watch_directory_presets SET name=?, enabled=?, path=?, recursive=?, usePolling=?, interval=?, ignoreDotFiles=? WHERE id=?`;
    this.run(sql, [
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
  removeWatchDirectoryPreset(id: number) {
    this.run("DELETE FROM watch_directory_presets WHERE id=?", [id]);
  }

  addWatchCondition(condition: Omit<WatchCondition, "id">) {
    const sql = `INSERT INTO watch_conditions (name, directoryId, enabled, priority, type, useRegExp, pattern, destination, delay, renamePattern) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    this.run(sql, [
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
  updateWatchCondition(id: number, condition: Omit<WatchCondition, "id"> | WatchCondition) {
    const sql = `UPDATE watch_conditions SET name=?, directoryId=?, enabled=?, priority=?, type=?, useRegExp=?, pattern=?, destination=?, delay=?, renamePattern=? WHERE id=?`;
    this.run(sql, [
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
  removeWatchCondition(id: number) {
    this.run("DELETE FROM watch_conditions WHERE id=?", [id]);
  }

  addWatchConditionPreset(preset: Omit<WatchConditionPreset, "id">) {
    const sql = `INSERT INTO watch_condition_presets (name, enabled, priority, type, useRegExp, pattern, destination, delay, renamePattern) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    this.run(sql, [
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
  updateWatchConditionPreset(id: number, preset: Omit<WatchConditionPreset, "id"> | WatchConditionPreset) {
    const sql = `UPDATE watch_condition_presets SET name=?, enabled=?, priority=?, type=?, useRegExp=?, pattern=?, destination=?, delay=?, renamePattern=? WHERE id=?`;
    this.run(sql, [
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
  removeWatchConditionPreset(id: number) {
    this.run("DELETE FROM watch_condition_presets WHERE id=?", [id]);
  }

  createLog(log: { directoryId: number; conditionId: number; message: string }) {
    const sql = "INSERT INTO logs(date, directoryId, conditionId, message) VALUES (?, ?, ?, ?)";
    this.run(sql, [Date.now(), log.directoryId, log.conditionId, log.message]);
  }
  getLogCount(options?: LogSearchOption) {
    let sql = "SELECT COUNT(*) AS count FROM logs";
    const { option, params, suffix } = this.getLogCondition(options);
    if (option.length) {
      sql += " WHERE ";
      sql += option.join(" AND ");
    }
    sql += " ORDER BY id DESC";
    sql += suffix;

    const { count } = this.get<{ count: number }>(sql, params);

    return count;
  }
  getLogs(options?: LogSearchOption, dateFormat?: string) {
    let sql = "SELECT * FROM logs";
    const { option, params, suffix } = this.getLogCondition(options);
    if (option.length) {
      sql += " WHERE ";
      sql += option.join(" AND ");
    }
    sql += " ORDER BY id DESC";
    sql += suffix;

    const result = this.all<Log[]>(sql, params);
    result.map((log) => {
      if (typeof log.date === "number") {
        log.date = DateTime.fromMillis(log.date).toFormat(dateFormat || "yyyy-MM-dd hh:mm:ss a");
      }
      return log;
    });
    return result as Log<string>[];
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

  getAdminId() {
    const sql = "SELECT value AS id FROM info WHERE key = 'adminId'";
    const result = this.get<{ id: string }>(sql);
    return result?.id;
  }
  setAdminId(id: string) {
    const sql = "UPDATE info SET value = ? WHERE key = 'adminId'";
    this.run(sql, [id]);
  }

  getAdminPasswordHash() {
    const sql = "SELECT value AS hash FROM info WHERE key = 'adminPasswordHash'";
    const result = this.get<{ hash: string }>(sql);
    return result?.hash;
  }
  setAdminPasswordHash(hash: string) {
    const sql = "UPDATE info SET value = ? WHERE key = 'adminPasswordHash'";
    this.run(sql, [hash]);
  }

  getSettings() {
    const sql = "SELECT value AS dateFormat FROM info WHERE key = 'dateFormat'";
    const result = this.get<{ dateFormat: string }>(sql);
    return result;
  }
  updateSettings(settings: { dateFormat?: string }) {
    if (settings.dateFormat) {
      const sql = "UPDATE info SET value = ? WHERE key = 'dateFormat'";
      this.run(sql, [settings.dateFormat]);
    }
  }

  get<T = unknown>(sql: string, params: any[] = []) {
    params = params.map(this.normalize).map(this.booleanToNumber);
    const result = this.db.prepare(sql.normalize()).get(...params);
    return result as T;
  }
  run(sql: string, params: any[] = []) {
    params = params.map(this.normalize).map(this.booleanToNumber);
    const result = this.db.prepare(sql.normalize()).run(...params);
    return result;
  }
  all<T = unknown[]>(sql: string, params: any[] = []) {
    params = params.map(this.normalize).map(this.booleanToNumber);
    const result = this.db.prepare(sql.normalize()).all(...params);
    return result as T;
  }

  private normalize(value: any) {
    if (typeof value === "string") {
      return value.normalize();
    }
    return value;
  }

  private booleanToNumber(value: any) {
    if (typeof value === "boolean") {
      return value ? 1 : 0;
    }
    return value;
  }
}

export const CONVEYOR_DEFAULT_DATABASE_PATH = "/conveyor/config/database.sqlite";

export function loadDatabase(databasePath: string = CONVEYOR_DEFAULT_DATABASE_PATH, create: boolean = false) {
  const db = new Database(databasePath, create);
  initializeTables(db);
  return db;
}

function isTableExists(db: Database, tableName: string) {
  return !!db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName]);
}

function initializeTables(db: Database) {
  for (const table of Object.keys(createTable)) {
    if (!isTableExists(db, table)) {
      createTable[table](db);
    }
  }
  return db;
}

function getLatestDatabaseVersion() {
  return readdirSync(path.join(__dirname, "../alteration/scripts")).map(getVersion).sort(semver.rcompare)[0];
}

const createTable: {
  [table: string]: (db: Database) => Promise<any>;
} = {
  info: async (db: Database) => {
    db.run("CREATE TABLE info (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    db.run("INSERT INTO info (key, value) VALUES (?, ?)", ["version", getLatestDatabaseVersion()]);
    db.run("INSERT INTO info (key, value) VALUES (?, ?)", ["adminId", "admin"]);
    db.run("INSERT INTO info (key, value) VALUES (?, ?)", [
      "adminPasswordHash",
      "$argon2id$v=19$m=65536,t=3,p=4$yLsjeK7Fwc79lwpOcCht2Q$RgL0tVoJR9x3Sq5oxniEtauLNHTNhq99R+AMxeYQyuE",
    ]); // changeme
    db.run("INSERT INTO info (key, value) VALUES (?, ?)", ["dateFormat", "yyyy-MM-dd hh:mm:ss a"]);
  },
  watch_directories: async (db: Database) =>
    db.run(
      "CREATE TABLE watch_directories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, path TEXT NOT NULL, recursive INTEGER NOT NULL DEFAULT 1, usePolling INTEGER NOT NULL DEFAULT 0, interval INTEGER, ignoreDotFiles INTEGER NOT NULL DEFAULT 1)"
    ),
  watch_directory_presets: async (db: Database) =>
    db.run(
      "CREATE TABLE watch_directory_presets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, path TEXT NOT NULL, recursive INTEGER NOT NULL DEFAULT 1, usePolling INTEGER NOT NULL DEFAULT 0, interval INTEGER, ignoreDotFiles INTEGER NOT NULL DEFAULT 1)"
    ),
  watch_conditions: async (db: Database) =>
    db.run(
      "CREATE TABLE watch_conditions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', directoryId INTEGER NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, priority INTEGER NOT NULL DEFAULT 0, type TEXT NOT NULL DEFAULT 'all', useRegExp INTEGER NOT NULL DEFAULT 0, pattern TEXT NOT NULL, destination TEXT NOT NULL, delay INTEGER NOT NULL DEFAULT 0, renamePattern TEXT, FOREIGN KEY(directoryId) REFERENCES watch_directories(id))"
    ),
  watch_condition_presets: async (db: Database) =>
    db.run(
      "CREATE TABLE watch_condition_presets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, priority INTEGER NOT NULL DEFAULT 0, type TEXT NOT NULL DEFAULT 'all', useRegExp INTEGER NOT NULL DEFAULT 0, pattern TEXT NOT NULL, destination TEXT NOT NULL, delay INTEGER NOT NULL DEFAULT 0, renamePattern TEXT)"
    ),
  logs: async (db: Database) =>
    db.run(
      "CREATE TABLE logs (id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000), directoryId INTEGER NOT NULL, conditionId INTEGER NOT NULL, message TEXT NOT NULL)"
    ),
};
