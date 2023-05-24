import path from "path";
import { cp, readdir } from "fs/promises";
import semver from "semver";
import { CONVEYOR_DEFAULT_DATABASE_PATH, Database } from "../modules/db";

export function getVersion(file: string) {
  if (file.endsWith(".js")) {
    return path.basename(file, ".js");
  }
  if (file.endsWith(".ts")) {
    return path.basename(file, ".ts");
  }
  return file;
}

export async function alterDatabase(databasePath: string = CONVEYOR_DEFAULT_DATABASE_PATH) {
  const db = new Database(databasePath);

  const currentVersion = db.get<{ value: string }>("SELECT value FROM info WHERE key = 'version'").value;
  console.log(`Current database version: ${currentVersion}`);

  const scripts = (await readdir(__dirname + "/scripts"))
    .map(getVersion)
    .filter((version) => semver.gt(version, currentVersion))
    .sort(semver.compare);

  if (scripts.length === 0) {
    console.log("No database alterations needed.");
    return;
  }

  console.log(`Found ${scripts.length} versions to upgrade to.`);
  for (const script of scripts) {
    console.log(`Backing up database to ${databasePath}.${currentVersion}.bak`);
    await cp(databasePath, `${databasePath}.${currentVersion}.bak`);
    console.log(`Upgrading to v${script}`);
    const { upgrade } = await import(`${__dirname}/scripts/${script}`);
    await upgrade(db);
  }
}

if (require.main === module) {
  alterDatabase(process.argv[2] ? process.argv[2] : undefined);
}
