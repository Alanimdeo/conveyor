import crypto from "crypto";
import { Database } from "../../modules/db";

export function upgrade(db: Database) {
  db.run("INSERT INTO info (key, value) VALUES (?, ?)", [
    "sessionSecret",
    crypto.randomBytes(32).toString(),
  ]);
}
