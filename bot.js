const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
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

//const banEveryoneCommand = require("./normal-commands/ownerBanEveryOneCommand.js");
const colorCommand = require("./normal-commands/checkColor.js")

const sendBugReport = require("./AnimekunSiteApi/bugReports.js");
const sendContact = require("./AnimekunSiteApi/contactApi.js");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
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

const botIconChangeTime = 8; //number (in minutes)
const botStatusChangeTime = 1; //number (in minutes)

client.on("messageCreate", async message => {
  if (message.author.bot) return; // Ignore messages from bots

  levelUp(message); //levelUp card
  avatarCommand(message); // avatar command
  purgeCommand(message); // purge command
  timeoutCommand(message); // mute command
  unmuteCommand(message); // ummute command
  kickCommand(message); // kick command
  banCommand(message); //ban command
  unbanCommand(message); // unban command
  // banEveryoneCommand(message); // ban evryone command

  colorCommand(message);

  checkMentionedAfk(message); // checks if user is afk & sends response
  await checkAfkStatus(message); // afk status

  // Handle AFK command
  if (message.content.startsWith(`${serverPrefix}afk`)) {
    await afkCommand(message);
  }

  if (message.content === `${serverPrefix}ping`) {
    const ping = Date.now() - message.createdTimestamp;
    const apiPing = Math.round(client.ws.ping);
    await message.reply(
      `Pong! 🏓\nServer Latency: ${ping}ms\nAPI Latency: ${apiPing}ms`
    );
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
        await interaction.reply("There was an error while executing this command.");
      }
    } catch (err) {
      console.error("Failed to send error reply:", err);
    }
  }
});

app.get("/", (req, res) => {
  res.send(`
        <h1>Bot Alive!!! - MANTO999</h1>
    `);
});

// this is for a bug report dont need to try this...
//
//
//
// THIS IS FOR ANOTHER PURPOSE IF YOU ARE USING THIS CODE, DONT FOLLOW THIS SECTION
app.post("/bug/report", async (req, res) => {
  try {
    //console.log("Received request body:", req.body);
    const { imageLink, email, name, bugDescription } = req.body;

    // Validate input
    if (!imageLink || !email || !name || !bugDescription) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Send report to Discord using the shared client instance
    const success = await sendBugReport(
      client,
      imageLink,
      email,
      name,
      bugDescription
    );
    if (success) {
      res.status(200).json({ message: "Bug report sent successfully!" });
    } else {
      res.status(500).json({ error: "Failed to send your report." });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
// bug report ended.

//contact

app.post("/contact", async (req, res) => {
  try {
    // console.log("Received request body:", req.body);
    const { name, email, desc } = req.body;

    // Validate input
    if (!name || !email || !desc) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Send report to Discord using the shared client instance
    const success = await sendContact(client, name, email, desc);
    ///console.log(success);
    if (success) {
      res.status(200).json({ message: "Contact sent successfully!" });
    } else {
      res.status(500).json({ error: "Failed to send your query." });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
// THIS IS FOR ANOTHER PURPOSE IF YOU ARE USING THIS CODE, DONT FOLLOW THIs SECTION

app.listen(PORT, () => console.log(`Server Started! Port: ${PORT}`));

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  startTasks(client, botStatusChangeTime, botIconChangeTime);
});

client.login(process.env.TOKEN);
