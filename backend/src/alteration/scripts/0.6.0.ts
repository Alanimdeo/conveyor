import crypto from "crypto";
import { Database } from "../../modules/db";

export function upgrade(db: Database) {
  db.run("PRAGMA journal_mode = DELETE");

  db.run("INSERT INTO info (key, value) VALUES (?, ?)", [
    "sessionSecret",
    crypto.randomBytes(32).toString(),
  ]);

  db.run(
    "ALTER TABLE watch_directory_presets ADD COLUMN customParameters TEXT NOT NULL DEFAULT '[]'"
  );
  db.run(
    "ALTER TABLE watch_condition_presets ADD COLUMN customParameters TEXT NOT NULL DEFAULT '[]'"
  );
}
