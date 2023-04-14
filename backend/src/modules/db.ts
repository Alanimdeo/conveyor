import sqlite from "sqlite3";

export class Database {
  private db: sqlite.Database;

  constructor(filename: string) {
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

  async getWatchConditions(directoryId: number) {
    const result = await this.all<WatchCondition[]>("SELECT * FROM watch_conditions WHERE directoryId=?", [
      directoryId,
    ]);
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

  async addWatchDirectory(directory: Omit<WatchDirectory, "id">) {
    console.log(3);
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

    const id = (await this.get<{ id: number }>("SELECT last_insert_rowid() AS id")).id;
    return id;
  }
  async updateWatchDirectory(id: number, directory: Omit<WatchDirectory, "id"> | WatchDirectory) {
    const sql = `UPDATE watch_directories SET enabled=?, path=?, recursive=?, usePolling=?, interval=?, ignoreDotFiles=? WHERE id=?`;
    await this.run(sql, [
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
  async updateWatchCondition(id: number, condition: Omit<WatchCondition, "id"> | WatchCondition) {
    const sql = `UPDATE watch_conditions SET directoryId=?, enabled=?, type=?, useRegExp=?, pattern=?, destination=?, renamePattern=? WHERE id=?`;
    await this.run(sql, [
      condition.directoryId,
      condition.enabled,
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
    const sql = "INSERT INTO logs(directoryId, conditionId, message) VALUES (?, ?, ?)";
    await this.run(sql, [log.directoryId, log.conditionId, log.message]);
  }
  async getLogs(options?: LogSearchOption) {
    let sql = "SELECT * FROM logs";
    const params: any[] = [];
    if (options) {
      const option: string[] = [];
      if (options.id) {
        option.push("id=?");
        params.push(options.id);
      }
      if (options.directoryId) {
        option.push("directoryId=?");
        params.push(options.directoryId);
      }
      if (options.conditionId) {
        option.push("conditionId=?");
        params.push(options.conditionId);
      }
      if (options.date) {
        option.push("date BETWEEN ? AND ?");
        params.push(options.date.from);
        params.push(options.date.to);
      }
      if (options.limit) {
        option.push("LIMIT ?");
      }

      // options가 비어있지 않은 객체일 때만 조건 추가
      if (option.length > 0) {
        sql += " WHERE " + option.join(" AND ");
      }
    }
    return await this.all<Log[]>(sql, params);
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
  date: string;
  time: string;
  directoryId: number;
  conditionId: number;
  message: string;
};

export function getDateFromLog(log: Log) {
  return new Date(log.date + " " + log.time);
}

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
  logs: async (db: Database) =>
    await db.run(
      "CREATE TABLE logs (id INTEGER PRIMARY KEY AUTOINCREMENT, date DATE NOT NULL DEFAULT (date('now')), time TIME NOT NULL DEFAULT (time('now')), directoryId INTEGER NOT NULL, conditionId INTEGER NOT NULL, message TEXT NOT NULL, FOREIGN KEY(directoryId) REFERENCES watch_directories(id), FOREIGN KEY(conditionId) REFERENCES watch_conditions(id))"
    ),
};
