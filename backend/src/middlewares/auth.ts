import { NextFunction, Request, Response } from "express";

export function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  if (req.session.username) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

export function isNotLoggedIn(req: Request, res: Response, next: NextFunction) {
  if (!req.session.username) {
    next();
    return;
  }
  res.status(400).json({ error: "Already logged in" });
}
