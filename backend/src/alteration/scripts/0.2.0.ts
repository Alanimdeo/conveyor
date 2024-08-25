import { Database } from "../../modules/db";

export function upgrade(db: Database) {
  db.run(
    "ALTER TABLE watch_conditions ADD COLUMN delay INTEGER NOT NULL DEFAULT 0"
  );
}
