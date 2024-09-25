import expressSession from "express-session";
import { Database } from "better-sqlite3";

declare module "better-sqlite3-session-store" {
  export default function createSqliteStore(
    session: typeof expressSession
  ): typeof SqliteStore;

  interface SqliteStoreOptions {
    client: Database;
    expired?: {
      clear?: boolean;
      intervalMs?: number;
    };
  }

  class SqliteStore extends expressSession.Store {
    constructor(options: SqliteStoreOptions);

    startInterval(): void;
    clearExpiredSessions(): void;
    createDb(): void;

    set(
      sid: string,
      session: expressSession.SessionData,
      callback?: (err: any) => void
    ): void;
    get(
      sid: string,
      callback: (err: any, session: expressSession.SessionData | null) => void
    ): void;
    destroy(sid: string, callback?: (err: any) => void): void;
    length(callback: (err: any, length: number) => void): void;
    clear(callback?: (err: any) => void): void;
    touch(
      sid: string,
      session: expressSession.SessionData,
      callback?: (err: any) => void
    ): void;
    all(
      callback: (
        err: any,
        obj: { [sid: string]: expressSession.SessionData } | null
      ) => void
    ): void;
  }
}
