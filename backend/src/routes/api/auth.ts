import { Router } from "express";
import { isLoggedIn, isNotLoggedIn } from "../../middlewares/auth";
import { forceJSON } from "../../middlewares/forceJSON";
import { ConveyorRequest } from ".";
import argon2 from "argon2";

const router = Router();

router.get("/login", (req: ConveyorRequest, res) => {
  if (req.session.username) {
    res.json({ isLoggedIn: true });
    return;
  }
  res.json({ isLoggedIn: false });
});

router.post("/login", forceJSON, isNotLoggedIn, async (req: ConveyorRequest, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  try {
    const adminId = await req.db!.getAdminId();
    const adminPasswordHash = await req.db!.getAdminPasswordHash();
    if (username !== adminId || !(await argon2.verify(adminPasswordHash, password))) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    req.session.username = username;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

router.post("/logout", isLoggedIn, (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/user", isLoggedIn, async (req: ConveyorRequest, res) => {
  res.json({
    username: req.session.username,
  });
});

router.patch("/user", isLoggedIn, forceJSON, async (req: ConveyorRequest, res) => {
  try {
    const { username, password, newPassword } = req.body;

    const adminPasswordHash = await req.db!.getAdminPasswordHash();
    if (!password || !(await argon2.verify(adminPasswordHash, password))) {
      res.status(403).json({ error: "Invalid current password" });
      return;
    }

    if (!username && !newPassword) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }
    if (username) {
      await req.db!.setAdminId(username);
      req.session.username = username;
    }
    if (newPassword) {
      await req.db!.setAdminPasswordHash(await argon2.hash(newPassword));
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
});

export { router as authRouter };
