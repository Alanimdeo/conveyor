import { Database } from "../../modules/db";

export async function upgrade(db: Database) {
  await db.run("INSERT INTO info (key, value) VALUES (?, ?)", ["dateFormat", "yyyy-MM-dd hh:mm:ss a"]);
  await db.run("UPDATE info SET value = '0.4.0' WHERE key = 'version'");
}
