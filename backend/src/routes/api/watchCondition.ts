import { Router } from "express";
import { isWatchCondition, isWatchConditionPreset } from "../../modules/db";
import { initializeWatcher } from "../../modules/watcher";
import { forceJSON } from "../../middlewares/forceJSON";
import { isLoggedIn } from "../../middlewares/auth";
import { checkDirectoryId, checkId } from "../../middlewares/checkId";

const router = Router();

router.get("/watch-condition", isLoggedIn, async (req, res) => {
  res.json(await req.db.getWatchConditions());
});

router.get("/watch-condition/count", isLoggedIn, async (req, res) => {
  const count = await req.db.getWatchConditionCount();
  res.json(count);
});

router.get("/watch-condition/:id", isLoggedIn, checkId, async (req, res) => {
  const id = Number(req.params.id);
  const condition = await req.db.getWatchCondition(id);
  if (!condition) {
    res.status(404).json({ error: "Condition not found" });
    return;
  }
  res.json(condition);
});

router.post("/watch-condition/:directoryId", isLoggedIn, checkDirectoryId, forceJSON, async (req, res) => {
  const directoryId = Number(req.params.directoryId);
  const directory = await req.db.getWatchDirectoryById(directoryId);
  if (!directory) {
    res.status(404).json({ error: "Directory not found" });
    return;
  }
  req.body.directoryId = directoryId;
  if (!isWatchCondition(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  await req.db.addWatchCondition(req.body);
  if (directory.enabled && !req.watchers![directoryId]) {
    req.watchers![directoryId] = await initializeWatcher(directory, req.db);
  }
  res.status(200).json({ success: true });
});

router.patch("/watch-condition/:id", isLoggedIn, checkId, forceJSON, async (req, res) => {
  const id = Number(req.params.id);
  const condition = await req.db.getWatchCondition(id);
  if (!condition) {
    res.status(404).json({ error: "Condition not found" });
    return;
  }
  if (!isWatchCondition(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  await req.db.updateWatchCondition(id, req.body);
  const conditions = await req.db.getWatchConditions(condition.directoryId);
  if (conditions.length === 0 && req.watchers![condition.directoryId]) {
    req.watchers![condition.directoryId].close();
    delete req.watchers![condition.directoryId];
  }
  res.status(200).json({ success: true });
});

router.delete("/watch-condition/:id", isLoggedIn, checkId, async (req, res) => {
  const id = Number(req.params.id);
  const condition = await req.db.getWatchCondition(id);
  if (!condition) {
    res.status(404).json({ error: "Condition not found" });
    return;
  }
  await req.db.removeWatchCondition(id);
  const conditions = await req.db.getWatchConditions(condition.directoryId);
  if (conditions.length === 0 && req.watchers![condition.directoryId]) {
    req.watchers![condition.directoryId].close();
    delete req.watchers![condition.directoryId];
  }
  res.status(200).json({ success: true });
});

router.get("/watch-condition-preset", isLoggedIn, async (req, res) => {
  res.json(await req.db.getWatchConditionPresets());
});

router.get("/watch-condition-preset/:id", isLoggedIn, checkId, async (req, res) => {
  const id = Number(req.params.id);
  const preset = await req.db.getWatchConditionPreset(id);
  if (!preset) {
    res.status(404).json({ error: "Preset not found" });
    return;
  }
  res.json(preset);
});

router.post("/watch-condition-preset", isLoggedIn, forceJSON, async (req, res) => {
  if (!isWatchConditionPreset(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  await req.db.addWatchConditionPreset(req.body);
  res.status(200).json({ success: true });
});

router.patch("/watch-condition-preset/:id", isLoggedIn, checkId, forceJSON, async (req, res) => {
  const id = Number(req.params.id);
  const preset = await req.db.getWatchConditionPreset(id);
  if (!preset) {
    res.status(404).json({ error: "Preset not found" });
    return;
  }
  if (!isWatchConditionPreset(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  await req.db.updateWatchConditionPreset(id, req.body);
  res.status(200).json({ success: true });
});

router.delete("/watch-condition-preset/:id", isLoggedIn, checkId, async (req, res) => {
  const id = Number(req.params.id);
  const preset = await req.db.getWatchConditionPreset(id);
  if (!preset) {
    res.status(404).json({ error: "Preset not found" });
    return;
  }
  await req.db.removeWatchConditionPreset(id);
  res.status(200).json({ success: true });
});

export { router as watchConditionRouter };
