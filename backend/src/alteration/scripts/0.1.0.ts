import { Database } from "../../modules/db";

export async function upgrade(db: Database) {
  await db.run("ALTER TABLE watch_directories ADD COLUMN name TEXT NOT NULL DEFAULT ''");
  await db.run("ALTER TABLE watch_conditions ADD COLUMN name TEXT NOT NULL DEFAULT ''");
  await db.run("ALTER TABLE watch_conditions ADD COLUMN priority INTEGER NOT NULL DEFAULT 0");
  await db.run("UPDATE info SET value = '0.1.0' WHERE key = 'version'");
}
