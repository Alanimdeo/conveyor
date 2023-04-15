import { Router } from "express";
import { ConveyorRequest } from ".";

const router = Router();

router.post("/log", async (req: ConveyorRequest, res) => {
  try {
    const logs = await req.db!.getLogs(req.body);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

router.post("/log/count", async (req: ConveyorRequest, res) => {
  try {
    const count = await req.db!.getLogCount(req.body);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

export { router as logRouter };
