import {
  Client,
  Collection,
  GatewayIntentBits,
  RateLimitData
} from "discord.js";
import { BotEvent, PrefixCommand, SlashCommand } from "./types";
import { config } from "../config";
import { cleanupTempFiles } from "../utils/paths";

// Prefix commands
import pingPrefix from "../commands/prefix/utility/ping";
import afkPrefix from "../commands/prefix/utility/afk";
import colorPrefix from "../commands/prefix/utility/color";
import testWelcomePrefix from "../commands/prefix/utility/testWelcome";
import testOnboardingPrefix from "../commands/prefix/utility/testOnboarding";
import testMentionPrefix from "../commands/prefix/utility/testMention";
import simulateJoinPrefix from "../commands/prefix/utility/simulateJoin";
import avatarPrefix from "../commands/prefix/fun/avatar";
import levelPrefix from "../commands/prefix/fun/level";
import banPrefix from "../commands/prefix/moderation/ban";
import kickPrefix from "../commands/prefix/moderation/kick";
import purgePrefix from "../commands/prefix/moderation/purge";
import timeoutPrefix from "../commands/prefix/moderation/timeout";
import unbanPrefix from "../commands/prefix/moderation/unban";
import unmutePrefix from "../commands/prefix/moderation/unmute";

// Slash commands
import { slashCommands } from "../commands/slash";

// Events
import readyEvent from "../events/client/ready";
import errorEvent from "../events/client/error";
import messageCreateEvent from "../events/interaction/messageCreate";
import interactionCreateEvent from "../events/interaction/interactionCreate";
import guildMemberAddEvent from "../events/guild/guildMemberAdd";

export class BotClient extends Client {
  public prefixCommands: Collection<string, PrefixCommand> = new Collection();
  public aliases: Collection<string, string> = new Collection();
  public slashCommands: Collection<string, SlashCommand> = new Collection();

  public constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
    });
  }

  public registerPrefixCommand(cmd: PrefixCommand): void {
    this.prefixCommands.set(cmd.name.toLowerCase(), cmd);
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        this.aliases.set(alias.toLowerCase(), cmd.name.toLowerCase());
      }
    }
  }

  public getPrefixCommand(nameOrAlias: string): PrefixCommand | undefined {
    const lower = nameOrAlias.toLowerCase();
    const primaryName = this.aliases.get(lower) || lower;
    return this.prefixCommands.get(primaryName);
  }

  public registerSlashCommand(cmd: SlashCommand): void {
    this.slashCommands.set(cmd.data.name, cmd);
  }

  public registerEvent(event: BotEvent<any>): void {
    if (event.once) {
      this.once(event.name, (...args) => event.execute(this, ...args));
    } else {
      this.on(event.name, (...args) => event.execute(this, ...args));
    }
  }

  public init(): void {
    cleanupTempFiles();

    // Register prefix commands
    const prefixCmds: PrefixCommand[] = [
      pingPrefix,
      afkPrefix,
      colorPrefix,
      testWelcomePrefix,
      testOnboardingPrefix,
      testMentionPrefix,
      simulateJoinPrefix,
      avatarPrefix,
      levelPrefix,
      banPrefix,
      kickPrefix,
      purgePrefix,
      timeoutPrefix,
      unbanPrefix,
      unmutePrefix
    ];
    for (const cmd of prefixCmds) {
      this.registerPrefixCommand(cmd);
    }

    // Register slash commands
    for (const cmd of slashCommands) {
      this.registerSlashCommand(cmd);
    }

    // Register events
    const events: BotEvent<any>[] = [
      readyEvent,
      errorEvent,
      messageCreateEvent,
      interactionCreateEvent,
      guildMemberAddEvent
    ];
    for (const event of events) {
      this.registerEvent(event);
    }

    // Rate-limit monitoring
    this.rest.on("rateLimited", (info: RateLimitData) => {
      console.warn(
        `⚠️ Discord API Rate Limited: Path=${info.route} | Timeout=${info.timeToReset}ms | Global=${info.global}`
      );
    });
  }

  public async start(token: string = config.token): Promise<string> {
    if (!token) {
      throw new Error("Missing Discord TOKEN in environment configuration.");
    }
    this.init();
    return this.login(token.trim());
  }
}

export default BotClient;
