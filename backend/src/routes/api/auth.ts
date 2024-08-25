import { Router } from "express";
import { isLoggedIn, isNotLoggedIn } from "../../middlewares/auth";
import { forceJSON } from "../../middlewares/forceJSON";
import argon2 from "argon2";

const router = Router();

router.get("/login", (req, res) => {
  if (req.session.username) {
    res.json({ isLoggedIn: true });
    return;
  }
  res.json({ isLoggedIn: false });
});

router.post("/login", forceJSON, isNotLoggedIn, async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  const adminId = req.db.getAdminId();
  const adminPasswordHash = req.db.getAdminPasswordHash();
  if (
    username !== adminId ||
    !(await argon2.verify(adminPasswordHash, password))
  ) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.session.username = username;
  res.json({ success: true });
});

router.post("/logout", isLoggedIn, (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get("/user", isLoggedIn, (req, res) => {
  res.json({
    username: req.session.username,
  });
});

router.patch("/user", isLoggedIn, forceJSON, async (req, res) => {
  const { username, password, newPassword } = req.body;

  const adminPasswordHash = req.db.getAdminPasswordHash();
  if (!password || !(await argon2.verify(adminPasswordHash, password))) {
    res.status(403).json({ error: "Invalid current password" });
    return;
  }

  if (!username && !newPassword) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }
  if (username) {
    req.db.setAdminId(username);
    req.session.username = username;
  }
  if (newPassword) {
    req.db.setAdminPasswordHash(await argon2.hash(newPassword));
  }

  res.json({ success: true });
});

export { router as authRouter };
