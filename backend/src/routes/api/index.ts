import { Router } from "express";
import { Request } from "express";
import session from "express-session";
import { FSWatcher } from "chokidar";
import { Database } from "../../modules/db";
import { authRouter } from "./auth";
import { settingsRouter } from "./settings";
import { watchDirectoryRouter } from "./watchDirectory";
import { watchConditionRouter } from "./watchCondition";
import { logRouter } from "./log";
import { isLoggedIn } from "../../middlewares/auth";

export type ConveyorRequest = Request & {
  session: session.Session & Partial<session.SessionData> & { username?: string };
  watchers?: Record<number, FSWatcher>;
  db?: Database;
};

const router = Router();

router.get("/db-version", isLoggedIn, (req: ConveyorRequest, res) => {
  res.send(req.db!.version);
});

router.use(authRouter);
router.use(settingsRouter);

router.use(watchDirectoryRouter);
router.use(watchConditionRouter);
router.use(logRouter);

export { router };
