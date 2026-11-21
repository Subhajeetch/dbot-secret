import { Events } from "discord.js";
import { BotEvent } from "../../core/types";
import { taskService } from "../../services/task.service";
import { config } from "../../config";
import { slashCommands } from "../../commands/slash";

export const readyEvent: BotEvent<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user?.tag}`);
    taskService.startTasks(client);

    // Auto-sync slash commands on startup
    try {
      const commandData = slashCommands.map(cmd => cmd.data.toJSON());

      if (config.guildId) {
        const guild = await client.guilds.fetch(config.guildId).catch(() => null);
        if (guild) {
          await guild.commands.set(commandData);
          console.log(`✅ Synced ${commandData.length} slash commands to guild ${config.guildId}`);
        } else {
          console.warn(`⚠️ Configured GUILD_ID ${config.guildId} could not be fetched.`);
        }
      } else {
        if (client.application) {
          await client.application.commands.set(commandData);
          console.log(
            `✅ Synced ${commandData.length} global slash commands (Note: Discord global commands can take up to 1 hour to propagate to all clients. Add GUILD_ID in .env for instant server update).`
          );
        }
      }
    } catch (err) {
      console.error("❌ Failed to auto-sync slash commands on ready:", err);
    }
  }
};

export default readyEvent;
