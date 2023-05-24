import { Database } from "../../modules/db";

export async function upgrade(db: Database) {
  db.run("ALTER TABLE watch_directories ADD COLUMN name TEXT NOT NULL DEFAULT ''");
  db.run("ALTER TABLE watch_conditions ADD COLUMN name TEXT NOT NULL DEFAULT ''");
  db.run("ALTER TABLE watch_conditions ADD COLUMN priority INTEGER NOT NULL DEFAULT 0");
  db.run("UPDATE info SET value = '0.1.0' WHERE key = 'version'");
}
