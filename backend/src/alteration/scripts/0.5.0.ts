import { Database } from "../../modules/db";

export function upgrade(db: Database) {
  db.run(
    "CREATE TABLE watch_directory_presets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, path TEXT NOT NULL, recursive INTEGER NOT NULL DEFAULT 1, usePolling INTEGER NOT NULL DEFAULT 0, interval INTEGER, ignoreDotFiles INTEGER NOT NULL DEFAULT 1)"
  );
  db.run(
    "CREATE TABLE watch_condition_presets (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL DEFAULT '', enabled INTEGER NOT NULL DEFAULT 1, priority INTEGER NOT NULL DEFAULT 0, type TEXT NOT NULL DEFAULT 'all', useRegExp INTEGER NOT NULL DEFAULT 0, pattern TEXT NOT NULL, destination TEXT NOT NULL, delay INTEGER NOT NULL DEFAULT 0, renamePattern TEXT)"
  );
}
