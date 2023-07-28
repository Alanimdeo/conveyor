import { Router } from "express";
import { authRouter } from "./api/auth";
import { settingsRouter } from "./api/settings";
import { watchDirectoryRouter } from "./api/watchDirectory";
import { watchConditionRouter } from "./api/watchCondition";
import { logRouter } from "./api/log";
import { isLoggedIn } from "../middlewares/auth";
import { errorHandler } from "../middlewares/errorHandler";

const router = Router();

router.get("/db-version", isLoggedIn, (req, res) => {
  res.send(req.db.version);
});

router.use(authRouter);
router.use(settingsRouter);

router.use(watchDirectoryRouter);
router.use(watchConditionRouter);
router.use(logRouter);

router.use(errorHandler);

export { router };
