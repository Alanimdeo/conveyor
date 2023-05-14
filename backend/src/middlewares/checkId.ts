import { NextFunction, Request, Response } from "express";

export function checkId(req: Request, res: Response, next: NextFunction) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  next();
}

export function checkDirectoryId(req: Request, res: Response, next: NextFunction) {
  const directoryId = Number(req.params.directoryId);
  if (isNaN(directoryId)) {
    res.status(400).json({ error: "Invalid directoryId" });
    return;
  }
  next();
}
