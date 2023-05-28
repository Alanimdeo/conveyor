import { Router } from "express";
import { forceJSON } from "../../middlewares/forceJSON";
import { isLoggedIn } from "../../middlewares/auth";

const router = Router();

router.post("/log", forceJSON, isLoggedIn, (req, res) => {
  const dateFormat = req.db.getSettings().dateFormat;
  const logs = req.db.getLogs(req.body, dateFormat);
  res.json(logs);
});

router.post("/log/count", isLoggedIn, (req, res) => {
  const count = req.db.getLogCount(req.body);
  res.json({ count });
});

export { router as logRouter };
