import { Router } from "express";
import { ConveyorRequest } from ".";
import { forceJSON } from "../../middlewares/forceJSON";

const router = Router();

router.get("/settings", async (req: ConveyorRequest, res) => {
  try {
    const settings = await req.db!.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

router.patch("/settings", forceJSON, async (req: ConveyorRequest, res) => {
  try {
    await req.db!.updateSettings(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

export { router as settingsRouter };
