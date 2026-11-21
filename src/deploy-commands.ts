import {
  Client,
  GatewayIntentBits,
  RESTPostAPIChatInputApplicationCommandsJSONBody
} from "discord.js";
import { config } from "./config";
import { slashCommands } from "./commands/slash";

const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = slashCommands.map(cmd =>
  cmd.data.toJSON()
);

if (!config.token) {
  console.error("Missing TOKEN in environment. Add TOKEN to your .env file.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  try {
    if (config.guildId) {
      const guild = await client.guilds.fetch(config.guildId);
      await guild.commands.set(commands);
      console.log(`✅ Registered ${commands.length} commands to guild ${config.guildId}`);
    } else {
      if (!client.application) {
        console.error("Client application is not ready.");
        return;
      }
      await client.application.commands.set(commands);
      console.log(
        `✅ Registered ${commands.length} global commands (Note: Discord global commands can take up to 1 hour to propagate. Add GUILD_ID in .env for instant update).`
      );
    }
  } catch (err) {
    console.error("Failed to register commands:", err);
  } finally {
    client.destroy();
  }
});

client.login(config.token).catch(err => {
  console.error("Failed to login for command deployment:", err);
  process.exit(1);
});
