require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const PORT = process.env.PORT || 8080;
const serverPrefix = require("./prifix.js");
const { startTasks } = require("./startingTasks.js");
const {
  afkCommand,
  checkAfkStatus,
  checkMentionedAfk
} = require("./normal-commands/afkCommand.js");
const levelUp = require("./normal-commands/level-up.js");
const avatarCommand = require("./normal-commands/avatar-command.js");
const purgeCommand = require("./normal-commands/purgeCommand.js");
const timeoutCommand = require("./normal-commands/timeoutCommand.js");
const unmuteCommand = require("./normal-commands/unMuteCommand.js");
const kickCommand = require("./normal-commands/kickCommand.js");
const banCommand = require("./normal-commands/banCommand.js");
const unbanCommand = require("./normal-commands/unbanCommand.js");
const colorCommand = require("./normal-commands/checkColor.js");

// Clean up any leftover temp files from previous runs
const cleanupLeftoverTempFiles = () => {
  const dirsToClean = [__dirname, path.join(__dirname, "imagemagick_templates")];
  const tempPatterns = [
    /^avatar.*\.png$/i,
    /^heart_.*\.png$/i,
    /^output-avatar\.png$/i,
    /^ping\.png$/i,
    /^temp-avatar-.*\.(tmp|jpg|png)$/i
  ];

  for (const dir of dirsToClean) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (tempPatterns.some(regex => regex.test(file))) {
        try {
          fs.unlinkSync(path.join(dir, file));
          console.log(`🧹 Removed leftover temp file: ${file}`);
        } catch (err) {
          console.warn(`⚠️ Failed to remove temp file ${file}:`, err.message);
        }
      }
    }
  }
};

cleanupLeftoverTempFiles();

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Load slash commands into a map on the client
client.slashCommands = new Map();
try {
  const slashPath = path.resolve(__dirname, "slash-commands");
  if (fs.existsSync(slashPath)) {
    const slashFiles = fs.readdirSync(slashPath).filter(f => f.endsWith(".js"));
    for (const file of slashFiles) {
      const command = require(path.join(slashPath, file));
      if (command && command.data && command.execute) {
        client.slashCommands.set(command.data.name, command);
      }
    }
  }
} catch (err) {
  console.error("Failed to load slash commands:", err);
}

const botIconChangeTime = 60; // 60 minutes (safe from Discord avatar rate limits)
const botStatusChangeTime = 1; // 1 minute

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;

  try {
    // AFK checks first (ignore if the user is currently running ?afk)
    const isAfkCmd =
      message.content === `${serverPrefix}afk` ||
      message.content.startsWith(`${serverPrefix}afk `);

    checkMentionedAfk(message);
    if (!isAfkCmd) {
      await checkAfkStatus(message);
    }

    if (!message.content.startsWith(serverPrefix)) return;

    if (message.content.trim() === `${serverPrefix}ping`) {
      const ping = Date.now() - message.createdTimestamp;
      const apiPing = Math.round(client.ws.ping);
      return await message.reply(
        `Pong! 🏓\nServer Latency: ${ping}ms\nAPI Latency: ${apiPing}ms`
      );
    }

    await afkCommand(message);
    await levelUp(message);
    await avatarCommand(message);
    await purgeCommand(message);
    await timeoutCommand(message);
    await unmuteCommand(message);
    await kickCommand(message);
    await banCommand(message);
    await unbanCommand(message);
    await colorCommand(message);
  } catch (err) {
    console.error("Unhandled error in messageCreate:", err);
  }
});

// Handle slash commands
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing /${interaction.commandName}:`, error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply("There was an error while executing this command.");
      } else {
        await interaction.reply({
          content: "There was an error while executing this command.",
          ephemeral: true
        });
      }
    } catch (err) {
      console.error("Failed to send error reply:", err);
    }
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.listen(PORT, () => console.log(`Server Started! Port: ${PORT}`));

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  startTasks(client, botStatusChangeTime, botIconChangeTime);
});

// Prevent unhandled errors from crashing the Render instance
process.on("unhandledRejection", err => {
  console.error("Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
});

client.login(process.env.TOKEN);