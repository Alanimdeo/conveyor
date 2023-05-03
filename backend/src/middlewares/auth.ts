import { NextFunction, Response } from "express";
import { ConveyorRequest } from "../routes/api";

export function isLoggedIn(req: ConveyorRequest, res: Response, next: NextFunction) {
  if (req.session.username) {
    next();
    return;
  }
  res.status(401).json({ error: "Unauthorized" });
}

export function isNotLoggedIn(req: ConveyorRequest, res: Response, next: NextFunction) {
  if (!req.session.username) {
    next();
    return;
  }
  res.status(400).json({ error: "Already logged in" });
}
