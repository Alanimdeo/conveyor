import { Database } from "../../modules/db";

export function upgrade(db: Database) {
  db.run("ALTER TABLE watch_directories ADD COLUMN name TEXT NOT NULL DEFAULT ''");
  db.run("ALTER TABLE watch_conditions ADD COLUMN name TEXT NOT NULL DEFAULT ''");
  db.run("ALTER TABLE watch_conditions ADD COLUMN priority INTEGER NOT NULL DEFAULT 0");
}
