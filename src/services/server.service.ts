import express, { Express, Request, Response } from "express";
import cors from "cors";

export function createHealthServer(): Express {
  const app = express();
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cors());

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  return app;
}

export function startHealthServer(port: number): Express {
  const app = createHealthServer();
  app.listen(port, () => console.log(`Server Started! Port: ${port}`));
  return app;
}
