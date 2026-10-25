const fs = require("fs");
const path = require("path");
const { errorEmbed } = require("../utils/embeds.js");
const serverPrefix = require("../prifix.js");

const usersAFKPath = path.resolve(__dirname, "../usersAFK.json");

// Keep AFK data in memory to avoid synchronous disk reads on every message
let afkCache = {};
if (fs.existsSync(usersAFKPath)) {
  try {
    afkCache = JSON.parse(fs.readFileSync(usersAFKPath, "utf-8"));
  } catch (err) {
    console.error("Error parsing initial AFK data:", err);
    afkCache = {};
  }
}

const saveAfkData = async () => {
  try {
    await fs.promises.writeFile(
      usersAFKPath,
      JSON.stringify(afkCache, null, 2),
      "utf-8"
    );
  } catch (err) {
    console.error("Error saving AFK data:", err);
  }
};

const afkCommand = async message => {
  const tokens = message.content.trim().split(/\s+/);
  if (tokens[0].toLowerCase() !== `${serverPrefix}afk`) return;

  try {
    const reason = tokens.slice(1).join(" ") || "none";
    const userId = message.author.id;

    if (afkCache[userId]) {
      const alreadyAfkEmbed = errorEmbed("You are already AFK bro.");
      const reply = await message.reply({ embeds: [alreadyAfkEmbed] });
      setTimeout(() => reply.delete().catch(() => {}), 10000);
      return;
    }

    afkCache[userId] = { timestamp: Date.now(), reason };
    await saveAfkData();

    return await message.reply({
      content: `AFK set. Reason: **${reason}**`,
      allowedMentions: { parse: [] }
    });
  } catch (error) {
    console.error("Error in AFK command:", error);
    const errorAfkEmbed = errorEmbed("An error occurred while setting AFK.");
    return await message.reply({ embeds: [errorAfkEmbed] });
  }
};

const checkAfkStatus = async message => {
  try {
    const userId = message.author.id;
    if (!afkCache[userId]) return;

    const afkTimestamp = afkCache[userId].timestamp;

    // Require at least 1 minute before removing AFK
    if (Date.now() - afkTimestamp <= 60000) return;

    const relativeTime = `<t:${Math.floor(afkTimestamp / 1000)}:R>`;

    delete afkCache[userId];
    await saveAfkData();

    const reply = await message.reply({
      content: `**Welcome Back!** You were AFK since ${relativeTime}.`,
      allowedMentions: { parse: [] }
    });

    setTimeout(() => reply.delete().catch(() => {}), 10000);
  } catch (error) {
    console.error("Error in checking AFK status:", error);
  }
};

const checkMentionedAfk = message => {
  try {
    message.mentions.users.forEach(user => {
      const userId = user.id;
      if (afkCache[userId]) {
        const afkTimestamp = afkCache[userId].timestamp;
        const reason = afkCache[userId].reason || "No reason provided";
        const relativeTime = `<t:${Math.floor(afkTimestamp / 1000)}:R>`;

        message.channel
          .send({
            content: `${user.username} is AFK since ${relativeTime} for reason: ${reason}`,
            allowedMentions: { parse: [] }
          })
          .then(msg => setTimeout(() => msg.delete().catch(() => {}), 10000))
          .catch(() => {});
      }
    });
  } catch (error) {
    console.error("Error in checking mentioned AFK:", error);
  }
};

module.exports = { afkCommand, checkAfkStatus, checkMentionedAfk };