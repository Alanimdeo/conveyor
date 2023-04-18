import path from "path";
import { cp, readdir } from "fs/promises";
import semver from "semver";
import { CONVEYOR_DEFAULT_DATABASE_PATH, Database } from "../modules/db";

export async function alterDatabase(databasePath: string = CONVEYOR_DEFAULT_DATABASE_PATH) {
  const db = new Database(databasePath);

  const currentVersion = (await db.get<{ value: string }>("SELECT value FROM info WHERE key = 'version'")).value;

  const scripts = (await readdir("./dist/alteration/scripts"))
    .map((version) => path.basename(version, ".js"))
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
    const { upgrade } = await import(`./scripts/${script}`);
    await upgrade(db);
  }
  // await db.run()
}

alterDatabase(process.argv[2] ? process.argv[2] : undefined);
