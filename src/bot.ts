import { BotClient } from "./core/client";
import { config } from "./config";
import { startHealthServer } from "./services/server.service";

// Global uncaught exception and unhandled rejection handlers
process.on("unhandledRejection", (err: unknown) => {
  console.error("Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", (err: Error) => {
  console.error("Uncaught Exception:", err);
});

// Start Express health monitoring server
startHealthServer(config.port);

// Initialize and start Discord bot client
export const client = new BotClient();

client.start().catch((err: Error) => {
  console.error("❌ Failed to login to Discord:", err);
});

export default client;
