import path from "path";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import createError from "http-errors";
import createMemoryStore from "memorystore";
import logger from "morgan";
import { loadDatabase } from "./modules/db";
import { initializeWatchers } from "./modules/watcher";
import { router as apiRouter } from "./routes/api";
import { alterDatabase } from "./alteration";

dotenv.config();

const MemoryStore = createMemoryStore(session);

async function main() {
  const server = express();
  const port = process.env.PORT || 3000;

  console.log("Checking database updates...");
  try {
    await alterDatabase(process.env.DB_FILE);
  } catch (err) {
    console.error("Skipping:", err instanceof Error ? err.message : err);
  }

  const db = await loadDatabase(process.env.DB_FILE, true);
  const watchers = await initializeWatchers(db);

  server.use(logger("combined"));
  server.use(express.json());
  server.use(express.urlencoded({ extended: false }));
  server.use(
    session({
      secret: process.env.SESSION_SECRET || Math.random().toString(36).substring(2),
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: 30 * 60 * 1000 }),
      cookie: { maxAge: 30 * 60 * 1000 },
    })
  );

  server.get("/favicon.ico", (_, res) => res.status(204).send());

  server.use(express.static(path.join(__dirname, "public")));
  server.use(
    "/api",
    (req, _, next) => {
      req.db = db;
      req.watchers = watchers;
      next();
    },
    apiRouter
  );

  server.get("/*", (_, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
  });

  server.use((_, __, next) => {
    next(createError(404));
  });

  const nodeServer = server.listen(port, () => {
    console.log(`Server listening on port ${port}!`);
  });

  for (const signal of ["SIGINT", "SIGTERM", "SIGQUIT"]) {
    process.on(signal, () => exit(signal));
  }

  function exit(signal: string) {
    console.log(`Received ${signal}.`);
    for (const id of Object.keys(watchers)) {
      watchers[Number(id)].close();
    }
    nodeServer.close();
    process.exit(0);
  }
}

main();
