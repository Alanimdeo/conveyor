import { Database } from "../../modules/db";

export async function upgrade(db: Database) {
  await db.run("INSERT INTO info (key, value) VALUES (?, ?)", ["adminId", "admin"]);
  await db.run("INSERT INTO info (key, value) VALUES (?, ?)", [
    "adminPasswordHash",
    "$argon2id$v=19$m=65536,t=3,p=4$yLsjeK7Fwc79lwpOcCht2Q$RgL0tVoJR9x3Sq5oxniEtauLNHTNhq99R+AMxeYQyuE",
  ]); // changeme
  await db.run("UPDATE info SET value = '0.3.0' WHERE key = 'version'");
}
