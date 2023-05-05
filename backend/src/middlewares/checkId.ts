import { NextFunction, Response } from "express";
import { ConveyorRequest } from "../routes/api";

export function checkId(req: ConveyorRequest, res: Response, next: NextFunction) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  next();
}

export function checkDirectoryId(req: ConveyorRequest, res: Response, next: NextFunction) {
  const directoryId = Number(req.params.directoryId);
  if (isNaN(directoryId)) {
    res.status(400).json({ error: "Invalid directoryId" });
    return;
  }
  next();
}
