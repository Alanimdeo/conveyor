import { NextFunction, Response } from "express";
import { ConveyorRequest } from "../routes/api";

export function forceJSON(req: ConveyorRequest, res: Response, next: NextFunction) {
  if (req.headers["content-type"] !== "application/json") {
    res.status(400).json({ error: 'Content-Type must be "application/json".' });
    return;
  }
  next();
}
