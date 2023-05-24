import { Router } from "express";
import { forceJSON } from "../../middlewares/forceJSON";

const router = Router();

router.get("/settings", (req, res) => {
  const settings = req.db.getSettings();
  res.json(settings);
});

router.patch("/settings", forceJSON, (req, res) => {
  req.db.updateSettings(req.body);
  res.json({ success: true });
});

export { router as settingsRouter };
