import { readFileSync } from "fs";
import path from "path";
import crypto from "crypto";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import rateLimit from "express-rate-limit";
import { csrf } from "lusca";
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

  const db = loadDatabase(process.env.DB_FILE, true);
  const watchers = initializeWatchers(db);

  server.use(logger("combined"));
  server.use(express.json());
  server.use(express.urlencoded({ extended: false }));
  server.use(cookieParser());

  const cookieExpiration =
    Number(process.env.COOKIE_EXPIRATION) || 30 * 60 * 1000;
  server.use(
    session({
      secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString(),
      resave: false,
      saveUninitialized: false,
      store: new MemoryStore({ checkPeriod: cookieExpiration }),
      cookie: { maxAge: cookieExpiration, sameSite: "strict" },
    })
  );

  server.use(
    csrf({
      cookie: {
        name: "_csrf",
      },
    })
  );

  const rateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
  });

  server.get("/favicon.ico", (_, res) => res.status(204).send());

  server.use(express.static(path.join(__dirname, "public")));
  server.use(
    "/api",
    rateLimiter,
    (req, _, next) => {
      req.db = db;
      req.watchers = watchers;
      next();
    },
    apiRouter
  );

  const indexHtml =
    process.env.NODE_ENV === "production"
      ? readFileSync(path.join(__dirname, "public/index.html"), "utf8")
      : undefined;

  server.get("/*", (_, res) => {
    res.send(indexHtml);
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
