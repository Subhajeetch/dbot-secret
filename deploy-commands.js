require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client, GatewayIntentBits } = require("discord.js");

const token = process.env.TOKEN;
const guildId = process.env.GUILD_ID; // optional: set for quicker testing

if (!token) {
    console.error("Missing TOKEN in environment. Add TOKEN to your .env file.");
    process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [];
const commandsPath = path.join(__dirname, "slash-commands");
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));
    for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command && command.data) commands.push(command.data.toJSON());
    }
}

client.once("ready", async () => {
    try {
        if (guildId) {
            const guild = await client.guilds.fetch(guildId);
            await guild.commands.set(commands);
            console.log(`Registered ${commands.length} commands to guild ${guildId}`);
        } else {
            await client.application.commands.set(commands);
            console.log(`Registered ${commands.length} global commands`);
        }
    } catch (err) {
        console.error("Failed to register commands:", err);
    } finally {
        client.destroy();
    }
});

client.login(token);
