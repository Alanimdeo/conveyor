import { Router } from "express";
import { isWatchDirectory, isWatchDirectoryPreset } from "@conveyor/types";
import { initializeWatcher } from "../../modules/watcher";
import { forceJSON } from "../../middlewares/forceJSON";
import { isLoggedIn } from "../../middlewares/auth";
import { checkId } from "../../middlewares/checkId";

const router = Router();

router.get("/watch-directory", isLoggedIn, async (req, res) => {
  res.json(await req.db.getWatchDirectories());
});

router.get("/watch-directory/count", isLoggedIn, async (req, res) => {
  const count = await req.db.getWatchDirectoryCount();
  res.json(count);
});

router.get("/watch-directory/:id", isLoggedIn, checkId, async (req, res) => {
  const id = Number(req.params.id);
  const directory = await req.db.getWatchDirectoryById(id);
  if (!directory) {
    res.status(404).json({ error: "Directory not found" });
    return;
  }
  res.json(directory);
});

router.get("/watch-directory/:id/conditions", isLoggedIn, checkId, async (req, res) => {
  const id = Number(req.params.id);
  const directory = await req.db.getWatchDirectoryById(id);
  if (!directory) {
    res.status(404).json({ error: "Directory not found" });
    return;
  }
  res.json(await req.db.getWatchConditions(id));
});

router.post("/watch-directory", isLoggedIn, forceJSON, async (req, res) => {
  if (!isWatchDirectory(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  await req.db.addWatchDirectory(req.body);
  res.status(200).json({ success: true });
});

router.patch("/watch-directory/:id", isLoggedIn, checkId, forceJSON, async (req, res) => {
  const id = Number(req.params.id);
  const directory = await req.db.getWatchDirectoryById(id);
  if (!directory) {
    res.status(404).json({ error: "Directory not found" });
    return;
  }
  if (!isWatchDirectory(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  await req.db.updateWatchDirectory(id, req.body);
  if (req.watchers![id]) {
    req.watchers![id].close();
  }
  if (req.body.enabled) {
    try {
      req.watchers![id] = await initializeWatcher(Object.assign(req.body, { id }), req.db);
    } catch (err) {
      if (!(err instanceof Error) || err.message !== "No active conditions found.") {
        console.error(err);
      }
    }
  }
  res.status(200).json({ success: true });
});

router.delete("/watch-directory/:id", isLoggedIn, checkId, async (req, res) => {
  const id = Number(req.params.id);
  const directory = await req.db.getWatchDirectoryById(id);
  if (!directory) {
    res.status(404).json({ error: "Directory not found" });
    return;
  }
  await req.db.removeWatchDirectory(id);
  for (const condition of await req.db.getWatchConditions(id)) {
    await req.db.removeWatchCondition(condition.id);
  }
  if (req.watchers![id]) {
    req.watchers![id].close();
    delete req.watchers![id];
  }
  res.status(200).json({ success: true });
});

router.get("/watch-directory-preset", isLoggedIn, async (req, res) => {
  res.json(await req.db.getWatchDirectoryPresets());
});

router.get("/watch-directory-preset/:id", isLoggedIn, checkId, async (req, res) => {
  const id = Number(req.params.id);
  const preset = await req.db.getWatchDirectoryPreset(id);
  if (!preset) {
    res.status(404).json({ error: "Preset not found" });
    return;
  }
  res.json(preset);
});

router.post("/watch-directory-preset", isLoggedIn, forceJSON, async (req, res) => {
  if (!isWatchDirectoryPreset(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  await req.db.addWatchDirectoryPreset(req.body);
  res.status(200).json({ success: true });
});

router.patch("/watch-directory-preset/:id", isLoggedIn, checkId, forceJSON, async (req, res) => {
  const id = Number(req.params.id);
  const preset = await req.db.getWatchDirectoryPreset(id);
  if (!preset) {
    res.status(404).json({ error: "Preset not found" });
    return;
  }
  if (!isWatchDirectoryPreset(req.body)) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  await req.db.updateWatchDirectoryPreset(id, req.body);
  res.status(200).json({ success: true });
});

router.delete("/watch-directory-preset/:id", isLoggedIn, checkId, async (req, res) => {
  const id = Number(req.params.id);
  const preset = await req.db.getWatchDirectoryPreset(id);
  if (!preset) {
    res.status(404).json({ error: "Preset not found" });
    return;
  }
  await req.db.removeWatchDirectoryPreset(id);
  res.status(200).json({ success: true });
});

export { router as watchDirectoryRouter };
