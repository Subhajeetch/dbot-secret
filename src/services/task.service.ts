import fs from "fs";
import { BotClient } from "../core/client";
import { config } from "../config";
import { getRootAssetPath } from "../utils/paths";

export class TaskService {
  private currentAvatarIndex = 0;
  private currentStatusIndex = 0;
  private isAvatarChanging = false;
  private lastAvatarChange = 0;

  public async changeBotAvatar(client: BotClient): Promise<void> {
    if (this.isAvatarChanging || !client.user) return;

    if (Date.now() - this.lastAvatarChange < config.avatarCooldownMs) {
      return;
    }

    this.isAvatarChanging = true;
    try {
      const avatarRelPath = config.avatarImages[this.currentAvatarIndex];
      this.currentAvatarIndex = (this.currentAvatarIndex + 1) % config.avatarImages.length;
      const avatarPath = getRootAssetPath(avatarRelPath);

      if (!fs.existsSync(avatarPath)) {
        this.isAvatarChanging = false;
        return;
      }

      const imageBuffer = await fs.promises.readFile(avatarPath);
      await client.user.setAvatar(imageBuffer);
      this.lastAvatarChange = Date.now();
      console.log("Successfully rotated bot avatar.");
    } catch (error: any) {
      if (
        error?.rawError?.message?.includes("AVATAR_RATE_LIMIT") ||
        error?.message?.includes("AVATAR_RATE_LIMIT")
      ) {
        console.warn("Discord avatar rate limit active. Backing off for 6 hours.");
        this.lastAvatarChange = Date.now();
      } else {
        console.error("Failed to change bot avatar:", error?.message);
      }
    } finally {
      this.isAvatarChanging = false;
    }
  }

  public changeStatus(client: BotClient): void {
    try {
      if (!client.user) return;
      const status = config.statuses[this.currentStatusIndex];
      client.user.setActivity(status.name, { type: status.type });
      this.currentStatusIndex = (this.currentStatusIndex + 1) % config.statuses.length;
    } catch (error: any) {
      console.error("Failed to change bot status:", error?.message);
    }
  }

  public startTasks(client: BotClient): void {
    this.changeStatus(client);
    setInterval(
      () => this.changeStatus(client),
      config.statusRotationMinutes * 60 * 1000
    );

    setInterval(
      () => this.changeBotAvatar(client),
      config.avatarRotationHours * 60 * 60 * 1000
    );
  }
}

export const taskService = new TaskService();
