const dns = require("dns");
// Fix Node 24 IPv6 connection hangs on Render containers
dns.setDefaultResultOrder("ipv4first");

require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const axios = require("axios");
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

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;

  try {
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
    if (error.code === 10062 || error.rawError?.code === 10062) {
      console.warn(`Interaction /${interaction.commandName} expired before response could be sent.`);
      return;
    }

    console.error(`Error executing /${interaction.commandName}:`, error);
    try {
      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply("There was an error while executing this command.");
      } else if (!interaction.replied) {
        await interaction.reply({
          content: "There was an error while executing this command.",
          ephemeral: true
        });
      }
    } catch (err) {
      if (err.code !== 10062 && err.rawError?.code !== 10062) {
        console.error("Failed to send error reply:", err);
      }
    }
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

app.listen(PORT, () => console.log(`Server Started! Port: ${PORT}`));

// Log all REST and Gateway events until the bot is ready
let isBotReady = false;

client.rest.on("rateLimited", info => {
  console.warn(`⚠️ Discord API Rate Limited: Path=${info.route} | Timeout=${info.timeToReset}ms | Global=${info.global}`);
});

client.rest.on("restDebug", info => {
  if (!isBotReady) console.log(`[REST Debug] ${info}`);
});

client.on("debug", info => {
  if (!isBotReady) console.log(`[Gateway Debug] ${info}`);
});

client.on("error", err => {
  console.error("Discord Client Error:", err);
});

client.once("ready", () => {
  isBotReady = true;
  console.log(`✅ Logged in as ${client.user.tag}`);
  startTasks(client, 1, 6);
});

process.on("unhandledRejection", err => {
  console.error("Unhandled Promise Rejection:", err);
});

process.on("uncaughtException", err => {
  console.error("Uncaught Exception:", err);
});

// Pre-flight check + login
async function connectBot() {
  const token = process.env.TOKEN ? process.env.TOKEN.trim() : "";
  if (!token) {
    console.error("❌ ERROR: Missing TOKEN environment variable! Add TOKEN in Render -> Environment.");
    return;
  }

  console.log("Running Discord Gateway pre-flight check...");
  try {
    const res = await axios.get("https://discord.com/api/v10/gateway/bot", {
      headers: { Authorization: `Bot ${token}` },
      timeout: 10000
    });
    const { remaining, total, reset_after } = res.data.session_start_limit;
    console.log(
      `✅ Discord API reachable! Sessions remaining: ${remaining}/${total} (resets in ${Math.round(reset_after / 1000)}s)`
    );
  } catch (err) {
    if (err.response) {
      const retryAfter = err.response.headers["retry-after"];
      console.error(
        `❌ Discord API blocked request! HTTP Status: ${err.response.status} | Retry-After: ${retryAfter || "unknown"} seconds`
      );
      if (err.response.status === 401) {
        console.error("❌ Your Discord Bot TOKEN is invalid or was reset. Generate a new token in Discord Developer Portal.");
        return;
      }
      if (err.response.status === 429) {
        console.error(
          "⚠️ Render's current shared IP is rate-limited by Discord/Cloudflare (HTTP 429). Wait for the Retry-After cooldown, or deploy in a different Render region (e.g., Singapore or Frankfurt) to get a fresh IP."
        );
      }
    } else {
      console.error("❌ Network error reaching Discord API:", err.message);
    }
  }

  console.log("Attempting to log in to Discord...");
  client.login(token).catch(err => {
    console.error("❌ Failed to login to Discord:", err);
  });
}

connectBot();