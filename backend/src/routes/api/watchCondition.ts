import { Router } from "express";
import { isWatchCondition } from "../../modules/db";
import { initializeWatcher } from "../../modules/watcher";
import { ConveyorRequest } from "./index";
import { forceJSON } from "../../middlewares/forceJSON";

const router = Router();

router.get("/watch-condition", (_, res) => {
  res.status(400).json({ error: "You must specify a id" });
});

router.get("/watch-condition/:id", async (req: ConveyorRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const condition = await req.db!.getWatchCondition(id);
    if (!condition) {
      res.status(404).json({ error: "Condition not found" });
      return;
    }
    res.json(condition);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

router.post("/watch-condition/:directoryId", forceJSON, async (req: ConveyorRequest, res) => {
  try {
    const directoryId = Number(req.params.directoryId);
    if (isNaN(directoryId)) {
      res.status(400).json({ error: "Invalid directoryId" });
      return;
    }
    const directory = await req.db!.getWatchDirectoryById(directoryId);
    if (!directory) {
      res.status(404).json({ error: "Directory not found" });
      return;
    }
    req.body.directoryId = directoryId;
    if (!isWatchCondition(req.body)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    await req.db!.addWatchCondition(req.body);
    if (directory.enabled && !req.watchers![directoryId]) {
      req.watchers![directoryId] = await initializeWatcher(directory, req.db!);
    }
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

router.delete("/watch-condition/:id", async (req: ConveyorRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const condition = await req.db!.getWatchCondition(id);
    if (!condition) {
      res.status(404).json({ error: "Condition not found" });
      return;
    }
    await req.db!.removeWatchCondition(id);
    const conditions = await req.db!.getWatchConditions(condition.directoryId);
    if (conditions.length === 0 && req.watchers![condition.directoryId]) {
      req.watchers![condition.directoryId].close();
      delete req.watchers![condition.directoryId];
    }
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

export { router as watchConditionRouter };
