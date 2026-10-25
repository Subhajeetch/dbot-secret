const { errorEmbed, successEmbed } = require("../utils/embeds.js");
const serverPrefix = require("../prifix.js");
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const purgeCommand = async message => {
  const tokens = message.content.trim().split(/\s+/);
  const cmd = tokens[0].toLowerCase();

  if (cmd !== `${serverPrefix}p` && cmd !== `${serverPrefix}purge`) return;

  if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    const noPermEmbed = errorEmbed("You don't have permissions bro.");
    return await message.reply({ embeds: [noPermEmbed] });
  }

  try {
    const args = tokens.slice(1);

    const sendPurgeGuide = () => {
      const provideNumEmbed = new EmbedBuilder()
        .setTitle("🍃 Purge Guide")
        .setColor(0x54ff32)
        .setDescription(
          `**Normal purge:**\n${serverPrefix}p 5\n${serverPrefix}purge 5\n\n**Specific user purge:**\n${serverPrefix}p 5 @user\n${serverPrefix}purge 5 @user`
        )
        .setFooter({ text: "Provide a number between 2 - 300." });
      return message.channel.send({ embeds: [provideNumEmbed] });
    };

    if (!args[0] || !/^\d+$/.test(args[0])) {
      return await sendPurgeGuide();
    }

    const numberToDelete = parseInt(args[0], 10);
    if (numberToDelete < 2 || numberToDelete > 300) {
      return await sendPurgeGuide();
    }

    let targetUser = null;
    if (args[1] && /^<@!?\d+>$/.test(args[1])) {
      targetUser = message.mentions.users.first();
    }

    // Delete the command invocation message first
    await message.delete().catch(() => {});

    let totalMessagesDeleted = 0;
    let lastId = null;

    while (totalMessagesDeleted < numberToDelete) {
      const remaining = numberToDelete - totalMessagesDeleted;
      const fetchLimit = targetUser ? 100 : Math.min(100, remaining);
      const fetchOptions = { limit: fetchLimit };
      if (lastId) fetchOptions.before = lastId;

      const fetchedMessages = await message.channel.messages.fetch(fetchOptions);
      if (!fetchedMessages.size) break;

      lastId = fetchedMessages.last().id;

      let messagesToDelete = targetUser
        ? fetchedMessages.filter(msg => msg.author.id === targetUser.id)
        : fetchedMessages;

      if (targetUser && messagesToDelete.size > remaining) {
        messagesToDelete = messagesToDelete.first(remaining);
      }

      if (!messagesToDelete.size && !targetUser) break;

      if (messagesToDelete.size || Array.isArray(messagesToDelete)) {
        const deleted = await message.channel.bulkDelete(messagesToDelete, true);
        totalMessagesDeleted += deleted.size;

        // Stop if all remaining matching messages are older than 14 days
        if (deleted.size === 0) break;
      }

      if (fetchedMessages.size < fetchLimit) break;
    }

    const successEmbedMessage = successEmbed(
      `Successfully purged ${totalMessagesDeleted} message(s).`
    );
    const confirmation = await message.channel.send({
      embeds: [successEmbedMessage]
    });
    setTimeout(() => confirmation.delete().catch(() => {}), 5000);
  } catch (error) {
    console.error("Error purging messages:", error);
    const errorPurgeEmbed = errorEmbed(
      "An error occurred while trying to purge messages. Ensure messages are not older than 14 days."
    );
    await message.channel.send({ embeds: [errorPurgeEmbed] });
  }
};

module.exports = purgeCommand;