import { Router } from "express";
import { isWatchCondition, isWatchConditionPreset } from "@conveyor/types";
import { initializeWatcher } from "../../modules/watcher";
import { forceJSON } from "../../middlewares/forceJSON";
import { isLoggedIn } from "../../middlewares/auth";
import { checkDirectoryId, checkId } from "../../middlewares/checkId";

const router = Router();

router.get("/watch-condition", isLoggedIn, (req, res) => {
  res.json(req.db.getWatchConditions());
});

router.get("/watch-condition/count", isLoggedIn, (req, res) => {
  const count = req.db.getWatchConditionCount();
  res.json(count);
});

router.get("/watch-condition/:id", isLoggedIn, checkId, (req, res) => {
  const id = Number(req.params.id);
  const condition = req.db.getWatchCondition(id);
  if (!condition) {
    res.status(404).json({ error: "Condition not found" });
    return;
  }
  res.json(condition);
});

router.post("/watch-condition/:directoryId", isLoggedIn, checkDirectoryId, forceJSON, (req, res) => {
  const directoryId = Number(req.params.directoryId);
  const directory = req.db.getWatchDirectoryById(directoryId);
  if (!directory) {
    res.status(404).json({ error: "Directory not found" });
    return;
  }
  req.body.directoryId = directoryId;
  if (!isWatchCondition(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  req.db.addWatchCondition(req.body);
  if (directory.enabled && !req.watchers[directoryId]) {
    req.watchers[directoryId] = initializeWatcher(directory, req.db);
  }
  res.status(200).json({ success: true });
});

router.patch("/watch-condition/:id", isLoggedIn, checkId, forceJSON, (req, res) => {
  const id = Number(req.params.id);
  const condition = req.db.getWatchCondition(id);
  if (!condition) {
    res.status(404).json({ error: "Condition not found" });
    return;
  }
  if (!isWatchCondition(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  req.db.updateWatchCondition(id, req.body);
  const conditions = req.db.getWatchConditions(condition.directoryId, { enabledOnly: true });
  if (conditions.length === 0 && req.watchers[condition.directoryId]) {
    req.watchers[condition.directoryId].close();
    delete req.watchers[condition.directoryId];
  } else if (conditions.length > 0 && !req.watchers[condition.directoryId]) {
    initializeWatcher(req.db.getWatchDirectoryById(condition.directoryId), req.db);
  }
  res.status(200).json({ success: true });
});

router.delete("/watch-condition/:id", isLoggedIn, checkId, (req, res) => {
  const id = Number(req.params.id);
  const condition = req.db.getWatchCondition(id);
  if (!condition) {
    res.status(404).json({ error: "Condition not found" });
    return;
  }
  req.db.removeWatchCondition(id);
  const conditions = req.db.getWatchConditions(condition.directoryId);
  if (conditions.length === 0 && req.watchers[condition.directoryId]) {
    req.watchers[condition.directoryId].close();
    delete req.watchers[condition.directoryId];
  }
  res.status(200).json({ success: true });
});

router.get("/watch-condition-preset", isLoggedIn, (req, res) => {
  res.json(req.db.getWatchConditionPresets());
});

router.get("/watch-condition-preset/:id", isLoggedIn, checkId, (req, res) => {
  const id = Number(req.params.id);
  const preset = req.db.getWatchConditionPreset(id);
  if (!preset) {
    res.status(404).json({ error: "Preset not found" });
    return;
  }
  res.json(preset);
});

router.post("/watch-condition-preset", isLoggedIn, forceJSON, (req, res) => {
  if (!isWatchConditionPreset(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  req.db.addWatchConditionPreset(req.body);
  res.status(200).json({ success: true });
});

router.patch("/watch-condition-preset/:id", isLoggedIn, checkId, forceJSON, (req, res) => {
  const id = Number(req.params.id);
  const preset = req.db.getWatchConditionPreset(id);
  if (!preset) {
    res.status(404).json({ error: "Preset not found" });
    return;
  }
  if (!isWatchConditionPreset(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  req.db.updateWatchConditionPreset(id, req.body);
  res.status(200).json({ success: true });
});

router.delete("/watch-condition-preset/:id", isLoggedIn, checkId, (req, res) => {
  const id = Number(req.params.id);
  const preset = req.db.getWatchConditionPreset(id);
  if (!preset) {
    res.status(404).json({ error: "Preset not found" });
    return;
  }
  req.db.removeWatchConditionPreset(id);
  res.status(200).json({ success: true });
});

export { router as watchConditionRouter };
