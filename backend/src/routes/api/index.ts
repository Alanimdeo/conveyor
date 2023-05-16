import { Router } from "express";
import { authRouter } from "./auth";
import { settingsRouter } from "./settings";
import { watchDirectoryRouter } from "./watchDirectory";
import { watchConditionRouter } from "./watchCondition";
import { logRouter } from "./log";
import { isLoggedIn } from "../../middlewares/auth";
import { errorHandler } from "../../middlewares/errorHandler";

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
