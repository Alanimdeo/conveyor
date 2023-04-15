import { Router } from "express";
import { Request } from "express";
import { FSWatcher } from "chokidar";
import { Database } from "../../modules/db";
import { watchDirectoryRouter } from "./watchDirectory";
import { watchConditionRouter } from "./watchCondition";
import { logRouter } from "./log";

export type ConveyorRequest = Request & {
  watchers?: Record<number, FSWatcher>;
  db?: Database;
};

const router = Router();

router.get("/db-version", (req: ConveyorRequest, res) => {
  res.send(req.db!.version);
});

router.use(watchDirectoryRouter);
router.use(watchConditionRouter);
router.use(logRouter);

export { router };
