import {
  Collection,
  EmbedBuilder,
  Message,
  PermissionFlagsBits,
  TextChannel,
  User
} from "discord.js";
import { PrefixCommand } from "../../../core/types";
import { settingsService } from "../../../services/settings.service";
import { errorEmbed, successEmbed } from "../../../utils/embeds";

export const purgeCommand: PrefixCommand = {
  name: "purge",
  aliases: ["p"],
  description: "Bulk deletes messages from the channel",
  category: "moderation",
  userPermissions: [PermissionFlagsBits.ManageMessages],
  async execute(message, args) {
    if (!message.member || !message.guild) return;

    if (!("bulkDelete" in message.channel)) {
      const cantPurgeEmbed = errorEmbed("Messages cannot be bulk deleted in this channel.");
      return await message.reply({ embeds: [cantPurgeEmbed] });
    }

    const channel = message.channel as TextChannel;
    const prefix = settingsService.getPrefix(message.guild.id);

    try {
      const sendPurgeGuide = () => {
        const provideNumEmbed = new EmbedBuilder()
          .setColor(2368553)
          .setTitle("Purge Guide")
          .setDescription(
            `**Normal purge:**\n${prefix}p 5\n${prefix}purge 5\n\n**Specific user purge:**\n${prefix}p 5 @user\n${prefix}purge 5 @user`
          )
          .setFooter({ text: "Provide a number between 2 - 300." });
        return channel.send({ embeds: [provideNumEmbed] });
      };

      if (!args[0] || !/^\d+$/.test(args[0])) {
        return await sendPurgeGuide();
      }

      const numberToDelete = parseInt(args[0], 10);
      if (numberToDelete < 2 || numberToDelete > 300) {
        return await sendPurgeGuide();
      }

      let targetUser: User | undefined = undefined;
      if (args[1] && /^<@!?\d+>$/.test(args[1])) {
        targetUser = message.mentions.users.first();
      }

      await message.delete().catch(() => {});

      let totalMessagesDeleted = 0;
      let lastId: string | undefined = undefined;

      while (totalMessagesDeleted < numberToDelete) {
        const remaining = numberToDelete - totalMessagesDeleted;
        const fetchLimit = targetUser ? 100 : Math.min(100, remaining);
        const fetchOptions: { limit: number; before?: string } = { limit: fetchLimit };
        if (lastId) fetchOptions.before = lastId;

        const fetchedMessages = await channel.messages.fetch(fetchOptions);
        if (!fetchedMessages.size) break;

        const lastMessage = fetchedMessages.last();
        if (!lastMessage) break;
        lastId = lastMessage.id;

        let messagesToDelete: Collection<string, Message> | Message[] = targetUser
          ? fetchedMessages.filter(msg => msg.author.id === targetUser?.id)
          : fetchedMessages;

        if (targetUser && messagesToDelete instanceof Collection && messagesToDelete.size > remaining) {
          messagesToDelete = messagesToDelete.first(remaining);
        }

        const toDeleteCount = Array.isArray(messagesToDelete)
          ? messagesToDelete.length
          : messagesToDelete.size;

        if (toDeleteCount === 0 && !targetUser) break;

        if (toDeleteCount > 0) {
          const deleted = await channel.bulkDelete(messagesToDelete, true);
          totalMessagesDeleted += deleted.size;
          if (deleted.size === 0) break;
        }

        if (fetchedMessages.size < fetchLimit) break;
      }

      const successEmbedMessage = successEmbed(
        `Successfully purged ${totalMessagesDeleted} message(s).`,
        "Purged"
      );
      const confirmation = await channel.send({
        embeds: [successEmbedMessage]
      });
      setTimeout(() => confirmation.delete().catch(() => {}), 5000);
    } catch (error) {
      console.error("Error purging messages:", error);
      const errorPurgeEmbed = errorEmbed(
        "An error occurred while trying to purge messages. Ensure messages are not older than 14 days."
      );
      await channel.send({ embeds: [errorPurgeEmbed] });
    }
  }
};

export default purgeCommand;
