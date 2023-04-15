import { Router } from "express";
import { isWatchDirectory } from "../../modules/db";
import { initializeWatcher } from "../../modules/watcher";
import { ConveyorRequest } from ".";
import { forceJSON } from "../../middlewares/forceJSON";

const router = Router();

router.get("/watch-directory", async (req: ConveyorRequest, res) => {
  try {
    res.json(await req.db!.getWatchDirectories());
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

router.get("/watch-directory/:id", async (req: ConveyorRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const directory = await req.db!.getWatchDirectoryById(id);
    if (!directory) {
      res.status(404).json({ error: "Directory not found" });
      return;
    }
    res.json(directory);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

router.get("/watch-directory/:id/conditions", async (req: ConveyorRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const directory = await req.db!.getWatchDirectoryById(id);
    if (!directory) {
      res.status(404).json({ error: "Directory not found" });
      return;
    }
    res.json(await req.db!.getWatchConditions(id));
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

router.post("/watch-directory", forceJSON, async (req: ConveyorRequest, res) => {
  try {
    if (!isWatchDirectory(req.body)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    await req.db!.addWatchDirectory(req.body);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

router.patch("/watch-directory/:id", forceJSON, async (req: ConveyorRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const directory = await req.db!.getWatchDirectoryById(id);
    if (!directory) {
      res.status(404).json({ error: "Directory not found" });
      return;
    }
    if (!isWatchDirectory(req.body)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    await req.db!.updateWatchDirectory(id, req.body);
    if (req.watchers![id]) {
      req.watchers![id].close();
    }
    if (req.body.enabled) {
      try {
        req.watchers![id] = await initializeWatcher(Object.assign(req.body, { id }), req.db!);
      } catch (err) {
        if (!(err instanceof Error) || err.message !== "No active conditions found.") {
          console.error(err);
        }
      }
    }
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

router.delete("/watch-directory/:id", async (req: ConveyorRequest, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const directory = await req.db!.getWatchDirectoryById(id);
    if (!directory) {
      res.status(404).json({ error: "Directory not found" });
      return;
    }
    await req.db!.removeWatchDirectory(id);
    for (const condition of await req.db!.getWatchConditions(id)) {
      await req.db!.removeWatchCondition(condition.id);
    }
    if (req.watchers![id]) {
      req.watchers![id].close();
      delete req.watchers![id];
    }
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

export { router as watchDirectoryRouter };
