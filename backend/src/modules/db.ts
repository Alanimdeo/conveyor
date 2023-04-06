import sqlite from "sqlite3";

export class Database {
  private db: sqlite.Database;

  constructor(filename: string) {
    this.db = new sqlite.Database(filename);
  }

  async getWatchDirectories(enabled: boolean = false) {
    return await this.all<WatchDirectory[]>("SELECT * FROM watch_directories WHERE enabled=?", [enabled]);
  }
  async getWatchDirectoryById(id: number) {
    return await this.get<WatchDirectory>("SELECT * FROM watch_directories WHERE id=?", [id]);
  }
  async getWatchDirectoryByPath(path: string) {
    return await this.get<WatchDirectory>("SELECT * FROM watch_directories WHERE path=?", [path]);
  }

  async getWatchConditions(directoryId: number, enabled: boolean = false) {
    const result = await this.all<WatchCondition[]>(
      "SELECT * FROM watch_conditions WHERE directoryId=? AND enabled=?",
      [directoryId, enabled]
    );
    return result.map((condition) => {
      if (condition.renamePattern && typeof condition.renamePattern === "string") {
        condition.renamePattern = JSON.parse(condition.renamePattern);
      }
      return condition;
    });
  }
  async getWatchCondition(id: number) {
    const result = await this.get<WatchCondition>("SELECT * FROM watch_conditions WHERE id=?", [id]);
    if (result.renamePattern && typeof result.renamePattern === "string") {
      result.renamePattern = JSON.parse(result.renamePattern);
    }
    return result;
  }

  async addWatchDirectory(directory: Omit<WatchDirectory, "id">) {
    const existing = await this.getWatchDirectoryByPath(directory.path);
    if (existing) {
      throw new Error(`Watch directory already exists: ${directory.path}`);
    }
    const sql = `INSERT INTO watch_directories (enabled, path, recursive, usePolling, interval, ignoreDotFiles) VALUES (?, ?, ?, ?, ?, ?)`;
    await this.run(sql, [
      directory.enabled,
      directory.path,
      directory.recursive,
      directory.usePolling,
      directory.interval || null,
      directory.ignoreDotFiles,
    ]);
  }
  async removeWatchDirectory(id: number) {
    await this.run("DELETE FROM watch_directories WHERE id=?", [id]);
  }

  async addWatchCondition(condition: Omit<WatchCondition, "id">) {
    const sql = `INSERT INTO watch_conditions (directoryId, enabled, type, useRegExp, pattern, destination, renamePattern) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    await this.run(sql, [
      condition.directoryId,
      condition.enabled,
      condition.type,
      condition.useRegExp,
      condition.pattern,
      condition.destination,
      condition.renamePattern ? JSON.stringify(condition.renamePattern) : null,
    ]);
  }
  async removeWatchCondition(id: number) {
    await this.run("DELETE FROM watch_conditions WHERE id=?", [id]);
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
        resolve(row as T);
      });
    });
  }
}

export type WatchDirectory = {
  id: number;
  enabled: boolean;
  path: string;
  recursive: boolean;
  usePolling: boolean;
  interval?: number;
  ignoreDotFiles: boolean;
};

export function isWatchDirectory(obj: any): obj is Omit<WatchDirectory, "id"> {
  return (
    // typeof obj.id === "number" &&
    typeof obj.enabled === "boolean" &&
    typeof obj.path === "string" &&
    typeof obj.recursive === "boolean" &&
    typeof obj.usePolling === "boolean" &&
    (obj.interval === undefined || typeof obj.interval === "number") &&
    typeof obj.ignoreDotFiles === "boolean"
  );
}

export type WatchCondition = {
  id: number;
  directoryId: number;
  enabled: boolean;
  type: "file" | "directory" | "all";
  useRegExp: boolean;
  pattern: string;
  destination: string;
  renamePattern?: RenamePattern;
};

export function isWatchCondition(obj: any): obj is Omit<WatchCondition, "id"> {
  return (
    // typeof obj.id === "number" &&
    typeof obj.directoryId === "number" &&
    typeof obj.enabled === "boolean" &&
    (obj.type === "file" || obj.type === "directory" || obj.type === "all") &&
    typeof obj.useRegExp === "boolean" &&
    typeof obj.pattern === "string" &&
    typeof obj.destination === "string" &&
    (obj.renamePattern === undefined || isRenamePattern(obj.renamePattern))
  );
}

export type RenamePattern = {
  pattern: string;
  replaceValue: string;
  excludeExtension: boolean;
  useRegExp: boolean;
};

export function isRenamePattern(obj: any): obj is RenamePattern {
  return (
    typeof obj.pattern === "string" &&
    typeof obj.replaceValue === "string" &&
    typeof obj.excludeExtension === "boolean" &&
    typeof obj.useRegExp === "boolean"
  );
}

export async function loadDatabase(databasePath: string = "database.sqlite") {
  const db = new Database(databasePath);
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

const createTable: {
  [table: string]: (db: Database) => Promise<Database>;
} = {
  watch_directories: async (db: Database) =>
    await db.run(
      "CREATE TABLE watch_directories (id INTEGER PRIMARY KEY AUTOINCREMENT, enabled INTEGER NOT NULL, path TEXT NOT NULL, recursive INTEGER NOT NULL, usePolling INTEGER NOT NULL, interval INTEGER, ignoreDotFiles INTEGER NOT NULL)"
    ),
  watch_conditions: async (db: Database) =>
    await db.run(
      "CREATE TABLE watch_conditions (id INTEGER PRIMARY KEY AUTOINCREMENT, directoryId INTEGER NOT NULL, enabled INTEGER NOT NULL, type TEXT NOT NULL, useRegExp INTEGER NOT NULL, pattern TEXT NOT NULL, destination TEXT NOT NULL, renamePattern TEXT, FOREIGN KEY(directoryId) REFERENCES watch_directories(id))"
    ),
};
