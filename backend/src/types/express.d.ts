import session from "express-session";
import { FSWatcher } from "chokidar";
import { Database } from "../modules/db";

declare module "express-serve-static-core" {
  interface Request {
    session: session.Session & Partial<session.SessionData> & { username?: string; time: number };
    watchers: Record<number, FSWatcher>;
    db: Database;
  }
}
