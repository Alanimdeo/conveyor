import { Router } from "express";
import { forceJSON } from "../../middlewares/forceJSON";
import { isLoggedIn } from "../../middlewares/auth";

const router = Router();

router.post("/log", forceJSON, isLoggedIn, async (req, res) => {
  const dateFormat = await req.db.getSettings().then((settings) => settings.dateFormat);
  const logs = await req.db.getLogs(req.body, dateFormat);
  res.json(logs);
});

router.post("/log/count", isLoggedIn, async (req, res) => {
  const count = await req.db.getLogCount(req.body);
  res.json({ count });
});

export { router as logRouter };
