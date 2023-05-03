import { Router } from "express";
import { ConveyorRequest } from ".";
import { forceJSON } from "../../middlewares/forceJSON";
import { isLoggedIn } from "../../middlewares/auth";

const router = Router();

router.post("/log", forceJSON, isLoggedIn, async (req: ConveyorRequest, res) => {
  try {
    const logs = await req.db!.getLogs(req.body);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

router.post("/log/count", isLoggedIn, async (req: ConveyorRequest, res) => {
  try {
    const count = await req.db!.getLogCount(req.body);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

export { router as logRouter };
