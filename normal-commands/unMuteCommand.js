const { errorEmbed, successEmbed } = require("../utils/embeds.js");
const serverPrefix = require("../prifix.js");
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const unmuteCommand = async message => {
  const tokens = message.content.trim().split(/\s+/);
  const cmd = tokens[0].toLowerCase();

  if (cmd !== `${serverPrefix}um` && cmd !== `${serverPrefix}unmute`) return;

  try {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      const noPermEmbed = errorEmbed("You don't have permissions bro.");
      return await message.reply({ embeds: [noPermEmbed] });
    }

    const args = tokens.slice(1);
    const mentionedUser = message.mentions.members.first();

    const sendUnmuteGuide = () => {
      const unmuteGuideEmbed = new EmbedBuilder()
        .setTitle("🍃  Unmute Guide")
        .setColor(0x54ff32)
        .setDescription(
          `**Usage:**\n${serverPrefix}unmute @user\n${serverPrefix}um @user`
        )
        .setFooter({ text: "Mention a user to unmute them." });
      return message.reply({ embeds: [unmuteGuideEmbed] });
    };

    if (args.length !== 1 || !/^<@!?\d+>$/.test(args[0]) || !mentionedUser) {
      return await sendUnmuteGuide();
    }

    if (
      message.author.id !== message.guild.ownerId &&
      message.member.roles.highest.position <=
        mentionedUser.roles.highest.position
    ) {
      return await message.reply({
        embeds: [
          errorEmbed(
            "You cannot unmute a member with an equal or higher role than yours."
          )
        ]
      });
    }

    if (!mentionedUser.isCommunicationDisabled()) {
      const notMutedEmbed = errorEmbed("User is not muted bro.");
      return await message.reply({ embeds: [notMutedEmbed] });
    }

    if (!mentionedUser.moderatable) {
      const cantUnmuteEmbed = errorEmbed(
        "I cannot unmute this user. Check my permissions and role hierarchy."
      );
      return await message.reply({ embeds: [cantUnmuteEmbed] });
    }

    await mentionedUser.timeout(null);

    const successUnmuteEmbed = successEmbed(
      `Successfully unmuted <@${mentionedUser.user.id}>.`
    );
    await message.reply({ embeds: [successUnmuteEmbed] });
  } catch (error) {
    console.error("Error in unmute command:", error);
    const errorUnmuteEmbed = errorEmbed(
      "An error occurred while trying to unmute the user."
    );
    await message.reply({ embeds: [errorUnmuteEmbed] });
  }
};

module.exports = unmuteCommand;