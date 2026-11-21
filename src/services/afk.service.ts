import fs from "fs";
import { Message } from "discord.js";
import { AfkCache, AfkEntry } from "../core/types";
import { getRootAssetPath } from "../utils/paths";

export class AfkService {
  private static instance: AfkService;
  private cache: AfkCache = {};
  private filePath: string;

  private constructor() {
    this.filePath = getRootAssetPath("usersAFK.json");
    this.load();
  }

  public static getInstance(): AfkService {
    if (!AfkService.instance) {
      AfkService.instance = new AfkService();
    }
    return AfkService.instance;
  }

  private load(): void {
    if (!fs.existsSync(this.filePath)) {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2), "utf-8");
        this.cache = {};
        console.log(`📁 Created new AFK storage: ${this.filePath}`);
      } catch (err) {
        console.error("Error creating AFK data file:", err);
        this.cache = {};
      }
      return;
    }

    try {
      const raw = fs.readFileSync(this.filePath, "utf-8").trim();
      this.cache = raw ? (JSON.parse(raw) as AfkCache) : {};
    } catch (err) {
      console.error("Error parsing AFK data file:", err);
      this.cache = {};
    }
  }

  public async save(): Promise<void> {
    try {
      await fs.promises.writeFile(
        this.filePath,
        JSON.stringify(this.cache, null, 2),
        "utf-8"
      );
    } catch (err) {
      console.error("Error saving AFK data file:", err);
    }
  }

  public isAfk(userId: string): boolean {
    return Boolean(this.cache[userId]);
  }

  public getAfk(userId: string): AfkEntry | undefined {
    return this.cache[userId];
  }

  public async setAfk(userId: string, reason: string): Promise<void> {
    this.cache[userId] = {
      timestamp: Date.now(),
      reason
    };
    await this.save();
  }

  public async removeAfk(userId: string): Promise<void> {
    delete this.cache[userId];
    await this.save();
  }

  public async checkAfkReturn(message: Message): Promise<void> {
    try {
      const userId = message.author.id;
      const afkData = this.getAfk(userId);
      if (!afkData) return;

      // Require at least 1 minute before removing AFK
      if (Date.now() - afkData.timestamp <= 60000) return;

      const relativeTime = `<t:${Math.floor(afkData.timestamp / 1000)}:R>`;
      await this.removeAfk(userId);

      const reply = await message.reply({
        content: `**Welcome Back!** You were AFK since ${relativeTime}.`,
        allowedMentions: { parse: [] }
      });
      setTimeout(() => reply.delete().catch(() => {}), 10000);
    } catch (error) {
      console.error("Error checking AFK return:", error);
    }
  }

  public checkMentionedAfk(message: Message): void {
    try {
      message.mentions.users.forEach(user => {
        const afkData = this.getAfk(user.id);
        if (afkData) {
          const relativeTime = `<t:${Math.floor(afkData.timestamp / 1000)}:R>`;
          const reason = afkData.reason || "No reason provided";

          if ("send" in message.channel && typeof message.channel.send === "function") {
            message.channel
              .send({
                content: `${user.username} is AFK since ${relativeTime} for reason: ${reason}`,
                allowedMentions: { parse: [] }
              })
              .then((msg: Message) => setTimeout(() => msg.delete().catch(() => {}), 10000))
              .catch(() => {});
          }
        }
      });
    } catch (error) {
      console.error("Error checking mentioned AFK:", error);
    }
  }
}

export const afkService = AfkService.getInstance();
