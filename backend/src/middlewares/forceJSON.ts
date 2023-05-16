import type { NextFunction, Request, Response } from "express";

export function forceJSON(req: Request, res: Response, next: NextFunction) {
  if (req.headers["content-type"] !== "application/json") {
    res.status(400).json({ error: 'Content-Type must be "application/json".' });
    return;
  }
  next();
}
