import { existsSync, readdirSync } from "fs";
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

  async getWatchDirectoryCount() {
    return await this.get<{
      count: number;
      enabled: number;
    }>("SELECT COUNT(*) AS count, COUNT(CASE WHEN enabled = 1 THEN 1 END) AS enabled FROM watch_directories");
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

  async getWatchConditionCount() {
    return await this.get<{
      count: number;
      enabled: number;
    }>("SELECT COUNT(*) AS count, COUNT(CASE WHEN enabled = 1 THEN 1 END) AS enabled FROM watch_conditions");
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

  async addWatchCondition(condition: Omit<WatchCondition, "id">) {
    const sql = `INSERT INTO watch_conditions (name, directoryId, enabled, priority, type, useRegExp, pattern, destination, renamePattern) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await this.run(sql, [
      condition.name,
      condition.directoryId,
      condition.enabled,
      condition.priority,
      condition.type,
      condition.useRegExp,
      condition.pattern,
      condition.destination,
      condition.renamePattern ? JSON.stringify(condition.renamePattern) : null,
    ]);
  }
  async updateWatchCondition(id: number, condition: Omit<WatchCondition, "id"> | WatchCondition) {
    const sql = `UPDATE watch_conditions SET name=?, directoryId=?, enabled=?, priority=?, type=?, useRegExp=?, pattern=?, destination=?, renamePattern=? WHERE id=?`;
    await this.run(sql, [
      condition.name,
      condition.directoryId,
      condition.enabled,
      condition.priority,
      condition.type,
      condition.useRegExp,
      condition.pattern,
      condition.destination,
      condition.renamePattern ? JSON.stringify(condition.renamePattern) : null,
      id,
    ]);
  }
  async removeWatchCondition(id: number) {
    await this.run("DELETE FROM watch_conditions WHERE id=?", [id]);
  }

  async createLog(log: { directoryId: number; conditionId: number; message: string }) {
    const sql = "INSERT INTO logs(date, directoryId, conditionId, message) VALUES (?, ?, ?, ?)";
    await this.run(sql, [Date.now(), log.directoryId, log.conditionId, log.message]);
  }
  async getLogCount(options?: LogSearchOption) {
    let sql = "SELECT COUNT(*) AS count FROM logs";
    const { option, params, suffix } = this.getLogCondition(options);
    if (option.length) {
      sql += " " + option.join(" AND ");
    }
    sql += suffix;

    const { count } = await this.get<{ count: number }>(sql, params);

    return count;
  }
  async getLogs(options?: LogSearchOption) {
    let sql = "SELECT * FROM logs ORDER BY id DESC";
    const { option, params, suffix } = this.getLogCondition(options);
    if (option.length) {
      sql += " " + option.join(" AND ");
    }
    sql += suffix;

    console.log(sql, params);

    const result = await this.all<Log[]>(sql, params);
    result.map((log) => {
      log.date = new Date(log.date);
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

    if (option.length) {
      option.unshift("WHERE");
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
  renamePattern?: RenamePattern;
};

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
  date: Date;
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
  directoryId?: number | number[];
  conditionId?: number | number[];
};

export async function loadDatabase(databasePath: string = "/conveyor/config/database.sqlite", create: boolean = false) {
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
    return db;
  },
  watch_directories: async (db: Database) =>
    await db.run(
      "CREATE TABLE watch_directories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, path TEXT NOT NULL, recursive INTEGER NOT NULL DEFAULT 1, usePolling INTEGER NOT NULL DEFAULT 0, interval INTEGER, ignoreDotFiles INTEGER NOT NULL DEFAULT 1)"
    ),
  watch_conditions: async (db: Database) =>
    await db.run(
      "CREATE TABLE watch_conditions (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', directoryId INTEGER NOT NULL, enabled INTEGER NOT NULL DEFAULT 1, priority INTEGER NOT NULL DEFAULT 0, type TEXT NOT NULL DEFAULT 'all', useRegExp INTEGER NOT NULL DEFAULT 0, pattern TEXT NOT NULL, destination TEXT NOT NULL, renamePattern TEXT, FOREIGN KEY(directoryId) REFERENCES watch_directories(id))"
    ),
  logs: async (db: Database) =>
    await db.run(
      "CREATE TABLE logs (id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000), directoryId INTEGER NOT NULL, conditionId INTEGER NOT NULL, message TEXT NOT NULL, FOREIGN KEY(directoryId) REFERENCES watch_directories(id), FOREIGN KEY(conditionId) REFERENCES watch_conditions(id))"
    ),
};
