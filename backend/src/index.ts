import path from "path";
import dotenv from "dotenv";
import express from "express";
import createError from "http-errors";
import cookieParser from "cookie-parser";
import logger from "morgan";
import { loadDatabase } from "./modules/db";
import { initializeWatchers } from "./modules/watcher";
import { router as apiRouter } from "./routes/api";
import type { ConveyorRequest } from "./routes/api";

dotenv.config();

async function main() {
  const server = express();
  const port = process.env.PORT || 3000;

  const db = await loadDatabase(process.env.DATABASE_PATH);
  const watchers = await initializeWatchers(db);

  server.use(logger("combined"));
  server.use(express.json());
  server.use(express.urlencoded({ extended: false }));
  server.use(cookieParser());

  server.get("/favicon.ico", (_, res) => res.status(204).send());

  server.use(express.static(path.join(__dirname, "public")));
  server.use(
    "/api",
    (req: ConveyorRequest, _, next) => {
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