import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import type { FSWatcher } from "chokidar";
import { isWatchCondition, isWatchDirectory } from "../modules/db";
import type { Database } from "../modules/db";
import { initializeWatcher } from "../modules/watcher";

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
    const id = await req.db!.addWatchDirectory(req.body);
    res.status(200).json({ success: true });
    // 어차피 감시 조건이 없어 활성화되지 않음
    // if (req.body.enabled) {
    //   req.watchers![id] = await initializeWatcher(Object.assign(req.body, { id }), req.db!);
    // }
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

router.patch("/watch-condition/:id", forceJSON, async (req: ConveyorRequest, res) => {
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
    if (!isWatchCondition(req.body)) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    await req.db!.updateWatchCondition(id, req.body);
    const directory = await req.db!.getWatchDirectoryById(condition.directoryId);
    if (directory.enabled && !req.watchers![directory!.id]) {
      req.watchers![directory.id] = await initializeWatcher(directory, req.db!);
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

export { router };
