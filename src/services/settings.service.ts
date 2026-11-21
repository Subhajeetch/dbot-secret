import fs from "fs";
import { config } from "../config";
import { getRootAssetPath } from "../utils/paths";

export interface GuildSettings {
  prefix: string;
  mainChannelId?: string;
  serverName?: string; // Custom server name for onboarding DMs
  onboardingDmEnabled: boolean;
  onboardingDmDelay: number; // in seconds, default: 59
  welcomeReplyEnabled: boolean;
  welcomeReplyDelay: number; // in seconds, default: 7
  mentionReplyEnabled: boolean; // default: true
  mentionMessage?: string; // default: "Need Help? go here: {channel}"
  mentionChannelId?: string; // target channel for mention reply, falls back to mainChannelId
}

export type GuildSettingsCache = Record<string, GuildSettings>;

export class SettingsService {
  private static instance: SettingsService;
  private cache: GuildSettingsCache = {};
  private filePath: string;

  private constructor() {
    this.filePath = getRootAssetPath("guildSettings.json");
    this.load();
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  private getDefaultSettings(): GuildSettings {
    return {
      prefix: config.defaultPrefix,
      mainChannelId: undefined,
      serverName: undefined,
      onboardingDmEnabled: true,
      onboardingDmDelay: 59,
      welcomeReplyEnabled: true,
      welcomeReplyDelay: 7,
      mentionReplyEnabled: true,
      mentionMessage: undefined,
      mentionChannelId: undefined
    };
  }

  private load(): void {
    if (!fs.existsSync(this.filePath)) {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2), "utf-8");
        this.cache = {};
        console.log(`📁 Created new guild settings storage: ${this.filePath}`);
      } catch (err) {
        console.error("Error creating guild settings file:", err);
        this.cache = {};
      }
      return;
    }

    try {
      const raw = fs.readFileSync(this.filePath, "utf-8").trim();
      this.cache = raw ? (JSON.parse(raw) as GuildSettingsCache) : {};
    } catch (err) {
      console.error("Error parsing guild settings file:", err);
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
      console.error("Error saving guild settings file:", err);
    }
  }

  public getSettings(guildId: string): GuildSettings {
    const existing = this.cache[guildId];
    if (existing) {
      return {
        ...this.getDefaultSettings(),
        ...existing
      };
    }
    return this.getDefaultSettings();
  }

  public getPrefix(guildId?: string | null): string {
    if (!guildId) return config.defaultPrefix;
    return this.getSettings(guildId).prefix || config.defaultPrefix;
  }

  public async updateSettings(
    guildId: string,
    updates: Partial<GuildSettings>
  ): Promise<GuildSettings> {
    const current = this.getSettings(guildId);
    const updated: GuildSettings = {
      ...current,
      ...updates
    };
    this.cache[guildId] = updated;
    await this.save();
    return updated;
  }

  public async setPrefix(guildId: string, prefix: string): Promise<void> {
    await this.updateSettings(guildId, { prefix: prefix.trim() });
  }

  public async setMainChannel(guildId: string, channelId: string): Promise<void> {
    await this.updateSettings(guildId, { mainChannelId: channelId });
  }

  public async setServerName(guildId: string, serverName: string): Promise<void> {
    await this.updateSettings(guildId, { serverName: serverName.trim() });
  }

  public async resetServerName(guildId: string): Promise<void> {
    const current = this.getSettings(guildId);
    const updated: GuildSettings = { ...current };
    delete updated.serverName;
    this.cache[guildId] = updated;
    await this.save();
  }

  public async setOnboardingDelay(guildId: string, delaySeconds: number): Promise<void> {
    await this.updateSettings(guildId, {
      onboardingDmDelay: Math.max(1, delaySeconds)
    });
  }

  public async toggleOnboarding(guildId: string, enabled?: boolean): Promise<boolean> {
    const current = this.getSettings(guildId);
    const nextState = enabled !== undefined ? enabled : !current.onboardingDmEnabled;
    await this.updateSettings(guildId, { onboardingDmEnabled: nextState });
    return nextState;
  }

  public async setWelcomeDelay(guildId: string, delaySeconds: number): Promise<void> {
    await this.updateSettings(guildId, {
      welcomeReplyDelay: Math.max(1, delaySeconds)
    });
  }

  public async toggleWelcome(guildId: string, enabled?: boolean): Promise<boolean> {
    const current = this.getSettings(guildId);
    const nextState = enabled !== undefined ? enabled : !current.welcomeReplyEnabled;
    await this.updateSettings(guildId, { welcomeReplyEnabled: nextState });
    return nextState;
  }

  public async toggleMentionReply(guildId: string, enabled?: boolean): Promise<boolean> {
    const current = this.getSettings(guildId);
    const nextState = enabled !== undefined ? enabled : !current.mentionReplyEnabled;
    await this.updateSettings(guildId, { mentionReplyEnabled: nextState });
    return nextState;
  }

  public async setMentionMessage(guildId: string, message: string): Promise<void> {
    await this.updateSettings(guildId, { mentionMessage: message.trim() });
  }

  public async resetMentionMessage(guildId: string): Promise<void> {
    const current = this.getSettings(guildId);
    const updated: GuildSettings = { ...current };
    delete updated.mentionMessage;
    this.cache[guildId] = updated;
    await this.save();
  }

  public async setMentionChannel(guildId: string, channelId: string): Promise<void> {
    await this.updateSettings(guildId, { mentionChannelId: channelId });
  }

  public async resetMentionChannel(guildId: string): Promise<void> {
    const current = this.getSettings(guildId);
    const updated: GuildSettings = { ...current };
    delete updated.mentionChannelId;
    this.cache[guildId] = updated;
    await this.save();
  }

  public getMentionReply(guildId: string): string {
    const settings = this.getSettings(guildId);
    const raw = settings.mentionMessage || "Need Help? go here: {channel}";
    const channelTarget = settings.mentionChannelId || settings.mainChannelId;
    const channelMention = channelTarget ? `<#${channelTarget}>` : "#general";
    return raw
      .replace(/\{channel\}/gi, channelMention)
      .replace(/\{prefix\}/gi, settings.prefix || config.defaultPrefix);
  }
}

export const settingsService = SettingsService.getInstance();
