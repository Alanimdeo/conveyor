import { NextFunction, Request, Response, Router } from "express";
import { FSWatcher } from "chokidar";
import { Database, isWatchCondition, isWatchDirectory } from "../modules/db";

export type ConveyorRequest = Request & {
  watchers?: Record<number, FSWatcher>;
  db?: Database;
};

const router = Router();
function forceJSON(req: ConveyorRequest, res: Response, next: NextFunction) {
  if (req.headers["content-type"] !== "application/json") {
    res.status(400).json({ error: 'Content-Type must be "application/json".' });
    return;
  }
  next();
}

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
    console.log(err);
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
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

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
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

export { router };
