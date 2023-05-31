import { Database } from "../../modules/db";

export function upgrade(db: Database) {
  db.run("PRAGMA foreign_keys = off");
  db.db.transaction(() => {
    db.db.prepare("ALTER TABLE logs RENAME TO _logs_old").run();
    db.db
      .prepare(
        "CREATE TABLE logs (id INTEGER PRIMARY KEY AUTOINCREMENT, date INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000), directoryId INTEGER NOT NULL, conditionId INTEGER NOT NULL, message TEXT NOT NULL)"
      )
      .run();
    db.db.prepare("INSERT INTO logs SELECT * FROM _logs_old").run();
    db.db.prepare("DROP TABLE _logs_old").run();
  })();
  db.run("PRAGMA foreign_keys = on");

  const watchDirectories = db.getWatchDirectories();
  const watchConditions = db.getWatchConditions();
  for (const watchCondition of watchConditions) {
    const { path } = watchDirectories.find((watchDirectory) => watchDirectory.id === watchCondition.directoryId)!;
    if (watchCondition.destination === path) {
      db.run("UPDATE watch_conditions SET destination = '$' WHERE id = ?", [watchCondition.id]);
    }
  }
}
