import { Database } from "../../modules/db";

export async function upgrade(db: Database) {
  db.run("ALTER TABLE watch_conditions ADD COLUMN delay INTEGER NOT NULL DEFAULT 0");
  db.run("UPDATE info SET value = '0.2.0' WHERE key = 'version'");
}
