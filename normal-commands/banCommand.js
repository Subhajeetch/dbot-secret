const { errorEmbed } = require("../utils/embeds.js");
const serverPrefix = require("../prifix.js");
const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");

const banCommand = async message => {
  const tokens = message.content.trim().split(/\s+/);
  const cmd = tokens[0].toLowerCase();

  if (cmd !== `${serverPrefix}b` && cmd !== `${serverPrefix}ban`) return;

  try {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      const noPermEmbed = errorEmbed("You don't have permissions bro.");
      return await message.reply({ embeds: [noPermEmbed] });
    }

    const args = tokens.slice(1);
    const mentionedUser = message.mentions.members.first();

    const sendBanGuide = () => {
      const banGuideEmbed = new EmbedBuilder()
        .setTitle("🍃 Guide")
        .setColor(0x03ff38)
        .setDescription(
          `**Usage:**\n${serverPrefix}b @user\n${serverPrefix}b @user reason\n${serverPrefix}ban @user reason\n\n**Examples:**\n${serverPrefix}ban @user Spamming\n${serverPrefix}b @user Rule violations`
        )
        .setFooter({ text: "Mention a user to ban them." });
      return message.reply({ embeds: [banGuideEmbed] });
    };

    if (!args[0] || !/^<@!?\d+>$/.test(args[0]) || !mentionedUser) {
      return await sendBanGuide();
    }

    if (mentionedUser.id === message.author.id) {
      return await message.reply({
        embeds: [errorEmbed("You cannot ban yourself bro.")]
      });
    }

    // Role hierarchy check for the moderator
    if (
      message.author.id !== message.guild.ownerId &&
      message.member.roles.highest.position <=
        mentionedUser.roles.highest.position
    ) {
      return await message.reply({
        embeds: [
          errorEmbed(
            "You cannot ban a member with an equal or higher role than yours."
          )
        ]
      });
    }

    if (!mentionedUser.bannable) {
      const cantBanEmbed = new EmbedBuilder()
        .setTitle("<:cross:1310179339005988945>  Unsuccessful")
        .setColor(0xff0320)
        .setDescription("User is immune, can't ban.");

      return await message.reply({ embeds: [cantBanEmbed] });
    }

    const reason = args.slice(1).join(" ") || "No reason provided";
    await mentionedUser.ban({ reason });

    const successBanEmbed = new EmbedBuilder()
      .setTitle("<:tick:1310179325152067676>  Success")
      .setColor(0x54ff32)
      .setDescription(
        `**Successfully banned <@${mentionedUser.user.id}>.**\n\nReason: ${reason}.`
      );
    await message.reply({ embeds: [successBanEmbed] });
  } catch (error) {
    console.error("Error in ban command:", error);
    const errorBanEmbed = errorEmbed(
      "An error occurred while trying to ban the user."
    );
    await message.reply({ embeds: [errorBanEmbed] });
  }
};

module.exports = banCommand;