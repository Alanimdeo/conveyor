import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: unknown, _: Request, res: Response, next: NextFunction) {
  console.error(err);
  res.status(500);
  if (err instanceof Error) {
    res.json({ error: err.message });
    return;
  }
  res.json({ error: err });
  next();
}
