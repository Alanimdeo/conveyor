import { Database } from "../../modules/db";

export async function upgrade(db: Database) {
  await db.run("ALTER TABLE watch_conditions ADD COLUMN delay INTEGER NOT NULL DEFAULT 0");
  await db.run("UPDATE info SET value = '0.2.0' WHERE key = 'version'");
}
