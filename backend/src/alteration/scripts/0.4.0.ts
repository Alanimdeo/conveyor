import { Database } from "../../modules/db";

export function upgrade(db: Database) {
  db.run("INSERT INTO info (key, value) VALUES (?, ?)", ["dateFormat", "yyyy-MM-dd hh:mm:ss a"]);
}
