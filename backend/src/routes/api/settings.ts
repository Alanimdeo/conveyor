import { Router } from "express";
import { forceJSON } from "../../middlewares/forceJSON";

const router = Router();

router.get("/settings", async (req, res) => {
  const settings = await req.db.getSettings();
  res.json(settings);
});

router.patch("/settings", forceJSON, async (req, res) => {
  await req.db.updateSettings(req.body);
  res.json({ success: true });
});

export { router as settingsRouter };
