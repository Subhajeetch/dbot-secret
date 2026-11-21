import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TextChannel,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import { SlashCommand } from "../../../core/types";
import { config } from "../../../config";
import { settingsService } from "../../../services/settings.service";
import { errorEmbed, successEmbed, INVISIBLE_COLOR } from "../../../utils/embeds";

function renderSetupPage(guildId: string, page: number, guildName = "the server"): {
  embed: EmbedBuilder;
  components: ActionRowBuilder<MessageActionRowComponentBuilder>[];
} {
  const settings = settingsService.getSettings(guildId);
  const embed = new EmbedBuilder().setColor(INVISIBLE_COLOR);
  const components: ActionRowBuilder<MessageActionRowComponentBuilder>[] = [];

  if (page === 1) {
    embed
      .setTitle("Server Setup (1/5) • Command Prefix")
      .setDescription(
        `Configure the prefix used for text-based commands in this server.\n\n` +
          `**Current Prefix:** \`${settings.prefix}\`\n` +
          `**Default Prefix:** \`${config.defaultPrefix}\`\n\n` +
          `Click below to set a custom prefix or reset back to default.`
      );

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("setup_btn_change_prefix")
        .setLabel("Change Prefix")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("setup_btn_reset_prefix")
        .setLabel("Reset to Default")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(settings.prefix === config.defaultPrefix)
    );
    components.push(actionRow as ActionRowBuilder<MessageActionRowComponentBuilder>);
  } else if (page === 2) {
    const channelDisplay = settings.mainChannelId
      ? `<#${settings.mainChannelId}>`
      : "Not configured (Required for onboarding & welcome)";

    embed
      .setTitle("Server Setup (2/5) • Main Chat Channel")
      .setDescription(
        `Set the primary chat channel. This channel is linked in onboarding DMs and used for sending welcome replies.\n\n` +
          `**Current Main Channel:** ${channelDisplay}\n\n` +
          `Select a text channel from the menu below or enter a channel ID manually.`
      );

    const selectMenuRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("setup_select_channel")
        .setPlaceholder("Select a text channel...")
        .setChannelTypes(ChannelType.GuildText)
    );
    components.push(selectMenuRow as ActionRowBuilder<MessageActionRowComponentBuilder>);

    const manualBtnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("setup_btn_manual_channel")
        .setLabel("Enter Channel ID Manually")
        .setStyle(ButtonStyle.Secondary)
    );
    components.push(manualBtnRow as ActionRowBuilder<MessageActionRowComponentBuilder>);
  } else if (page === 3) {
    const channelLink = settings.mainChannelId
      ? `<#${settings.mainChannelId}>`
      : "#main-chat";
    const currentServerName = settings.serverName || guildName;
    const serverNameLabel = settings.serverName
      ? `\`${settings.serverName}\` (Custom)`
      : `\`${guildName}\` (Default)`;

    embed
      .setTitle("Server Setup (3/5) • Onboarding DM")
      .setDescription(
        `Sends a friendly private message to new members after they join.\n\n` +
          `**Status:** ${settings.onboardingDmEnabled ? "Enabled" : "Disabled"}\n` +
          `**Server Name:** ${serverNameLabel}\n` +
          `**Delay:** ${settings.onboardingDmDelay} seconds (Default: 67s)\n` +
          `**Channel Link Status:** ${
            settings.mainChannelId
              ? `<#${settings.mainChannelId}>`
              : "⚠️ Main channel not configured yet"
          }\n\n` +
          `**Message Preview:**\n` +
          `> Thanks for joining ${currentServerName}. Dont hasitate to chat here: ${channelLink}. we don't bite dw :)`
      );

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("setup_btn_toggle_onboarding")
        .setLabel(settings.onboardingDmEnabled ? "Disable Onboarding" : "Enable Onboarding")
        .setStyle(settings.onboardingDmEnabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("setup_btn_set_onboarding_delay")
        .setLabel("Change Delay")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("setup_btn_set_server_name")
        .setLabel("Set Server Name")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("setup_btn_reset_server_name")
        .setLabel("Reset Name")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!settings.serverName)
    );
    components.push(actionRow as ActionRowBuilder<MessageActionRowComponentBuilder>);
  } else if (page === 4) {
    embed
      .setTitle("Server Setup (4/5) • Welcome Reply")
      .setDescription(
        `Sends a casual welcome greeting in the main chat pinging new members.\n\n` +
          `**Status:** ${settings.welcomeReplyEnabled ? "Enabled" : "Disabled"}\n` +
          `**Delay:** ${settings.welcomeReplyDelay} seconds (Default: 7s)\n` +
          `**Destination Channel:** ${
            settings.mainChannelId
              ? `<#${settings.mainChannelId}>`
              : "⚠️ Main channel not configured yet"
          }\n\n` +
          `**Message Samples (Selected Randomly):**\n` +
          `• @user hi..\n` +
          `• @user hey.. welcome :)\n` +
          `• @user hello there!`
      );

    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("setup_btn_toggle_welcome")
        .setLabel(settings.welcomeReplyEnabled ? "Disable Welcome Reply" : "Enable Welcome Reply")
        .setStyle(settings.welcomeReplyEnabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("setup_btn_set_welcome_delay")
        .setLabel("Change Delay")
        .setStyle(ButtonStyle.Primary)
    );
    components.push(actionRow as ActionRowBuilder<MessageActionRowComponentBuilder>);
  } else if (page === 5) {
    const currentChannelId = settings.mentionChannelId || settings.mainChannelId;
    const channelDisplay = currentChannelId
      ? `<#${currentChannelId}>`
      : "⚠️ Not configured (Will display `#general`)";
    const customMsg = settings.mentionMessage || "Need Help? go here: {channel}";
    const preview = settingsService.getMentionReply(guildId);

    embed
      .setTitle("Server Setup (5/5) • Bot Mention Reply")
      .setDescription(
        `When a user mentions the bot in a text channel, the bot replies with this helpful message.\n\n` +
          `**Status:** ${settings.mentionReplyEnabled ? "Enabled" : "Disabled"}\n` +
          `**Help / Target Channel:** ${channelDisplay}\n` +
          `**Message Template:**\n\`${customMsg}\`\n\n` +
          `**Message Preview:**\n> ${preview}\n\n` +
          `*Tip: Use \`{channel}\` to automatically insert the target channel link, or write any custom text you want.*`
      );

    const actionRow1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("setup_btn_toggle_mention")
        .setLabel(settings.mentionReplyEnabled ? "Disable Mention Reply" : "Enable Mention Reply")
        .setStyle(settings.mentionReplyEnabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("setup_btn_set_mention_msg")
        .setLabel("Set Message")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("setup_btn_reset_mention_msg")
        .setLabel("Reset Message")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!settings.mentionMessage || settings.mentionMessage === "Need Help? go here: {channel}")
    );
    components.push(actionRow1 as ActionRowBuilder<MessageActionRowComponentBuilder>);

    const selectMenuRow = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId("setup_select_mention_channel")
        .setPlaceholder("Select a help / target channel...")
        .setChannelTypes(ChannelType.GuildText)
    );
    components.push(selectMenuRow as ActionRowBuilder<MessageActionRowComponentBuilder>);

    const actionRow2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("setup_btn_manual_mention_channel")
        .setLabel("Enter Channel ID Manually")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("setup_btn_reset_mention_channel")
        .setLabel("Use Main Channel")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!settings.mentionChannelId)
    );
    components.push(actionRow2 as ActionRowBuilder<MessageActionRowComponentBuilder>);
  }

  // Navigation Row
  const navRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("setup_nav_prev")
      .setLabel("◀ Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 1),
    new ButtonBuilder()
      .setCustomId("setup_nav_indicator")
      .setLabel(`Page ${page} / 5`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId("setup_nav_next")
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 5),
    new ButtonBuilder()
      .setCustomId("setup_btn_done")
      .setLabel("Done")
      .setStyle(ButtonStyle.Success)
  );
  components.push(navRow as ActionRowBuilder<MessageActionRowComponentBuilder>);

  return { embed, components };
}

export const setupSlashCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure server prefix, main channel, onboarding, welcome, and bot mention reply")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) return;

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        embeds: [errorEmbed("You need Administrator permissions to use the setup command.")],
        ephemeral: true
      });
    }

    const guildId = interaction.guild.id;
    const guildName = interaction.guild.name;
    let currentPage = 1;

    const initial = renderSetupPage(guildId, currentPage, guildName);
    await interaction.reply({
      embeds: [initial.embed],
      components: initial.components
    });
    const response = await interaction.fetchReply();

    const collector = response.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 600000 // 10 minutes active
    });

    collector.on("collect", async i => {
      try {
        // Done: finish setup, remove all buttons, show success embed
        if (i.customId === "setup_btn_done") {
          collector.stop("done");
          const doneEmbed = successEmbed(
            "Setup completed successfully. All server configurations have been applied and saved.",
            "Success"
          );
          await i.update({
            embeds: [doneEmbed],
            components: []
          });
          return;
        }

        // Navigation: Previous
        if (i.customId === "setup_nav_prev") {
          currentPage = Math.max(1, currentPage - 1);
          const nextState = renderSetupPage(guildId, currentPage, guildName);
          await i.update({ embeds: [nextState.embed], components: nextState.components });
          return;
        }

        // Navigation: Next
        if (i.customId === "setup_nav_next") {
          currentPage = Math.min(5, currentPage + 1);
          const nextState = renderSetupPage(guildId, currentPage, guildName);
          await i.update({ embeds: [nextState.embed], components: nextState.components });
          return;
        }

        // Page 1: Change Prefix (Modal)
        if (i.customId === "setup_btn_change_prefix") {
          const modal = new ModalBuilder()
            .setCustomId("modal_change_prefix")
            .setTitle("Set Server Prefix");

          const prefixInput = new TextInputBuilder()
            .setCustomId("input_prefix")
            .setLabel("New Prefix (Max 5 chars)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. !, ?, ., $")
            .setMaxLength(5)
            .setMinLength(1)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(prefixInput));
          await i.showModal(modal);

          const modalSubmit = await i.awaitModalSubmit({
            filter: m => m.customId === "modal_change_prefix" && m.user.id === interaction.user.id,
            time: 60000
          }).catch(() => null);

          if (modalSubmit) {
            const newPrefix = modalSubmit.fields.getTextInputValue("input_prefix").trim();
            await modalSubmit.deferUpdate();
            await settingsService.setPrefix(guildId, newPrefix);
            const updated = renderSetupPage(guildId, currentPage, guildName);
            await interaction.editReply({
              embeds: [updated.embed],
              components: updated.components
            });
          }
          return;
        }

        // Page 1: Reset Prefix
        if (i.customId === "setup_btn_reset_prefix") {
          await settingsService.setPrefix(guildId, config.defaultPrefix);
          const updated = renderSetupPage(guildId, currentPage, guildName);
          await i.update({ embeds: [updated.embed], components: updated.components });
          return;
        }

        // Page 2: Channel Select Menu
        if (i.isChannelSelectMenu() && i.customId === "setup_select_channel") {
          const selectedChannelId = i.values[0];
          await settingsService.setMainChannel(guildId, selectedChannelId);
          const updated = renderSetupPage(guildId, currentPage, guildName);
          await i.update({ embeds: [updated.embed], components: updated.components });
          return;
        }

        // Page 2: Manual Channel ID (Modal)
        if (i.customId === "setup_btn_manual_channel") {
          const modal = new ModalBuilder()
            .setCustomId("modal_channel_id")
            .setTitle("Set Main Channel by ID");

          const channelInput = new TextInputBuilder()
            .setCustomId("input_channel_id")
            .setLabel("Channel ID")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. 123456789012345678")
            .setMaxLength(25)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput));
          await i.showModal(modal);

          const modalSubmit = await i.awaitModalSubmit({
            filter: m => m.customId === "modal_channel_id" && m.user.id === interaction.user.id,
            time: 60000
          }).catch(() => null);

          if (modalSubmit) {
            const rawChannelId = modalSubmit.fields.getTextInputValue("input_channel_id").replace(/[<#>]/g, "").trim();
            const channel = interaction.guild?.channels.cache.get(rawChannelId) ||
              (await interaction.guild?.channels.fetch(rawChannelId).catch(() => null));

            if (!channel || !(channel instanceof TextChannel)) {
              await modalSubmit.reply({
                embeds: [errorEmbed("Invalid channel ID or not a text channel in this server.")],
                ephemeral: true
              });
              return;
            }

            await modalSubmit.deferUpdate();
            await settingsService.setMainChannel(guildId, rawChannelId);
            const updated = renderSetupPage(guildId, currentPage, guildName);
            await interaction.editReply({
              embeds: [updated.embed],
              components: updated.components
            });
          }
          return;
        }

        // Page 3: Toggle Onboarding DM
        if (i.customId === "setup_btn_toggle_onboarding") {
          await settingsService.toggleOnboarding(guildId);
          const updated = renderSetupPage(guildId, currentPage, guildName);
          await i.update({ embeds: [updated.embed], components: updated.components });
          return;
        }

        // Page 3: Set Onboarding Delay (Modal)
        if (i.customId === "setup_btn_set_onboarding_delay") {
          const modal = new ModalBuilder()
            .setCustomId("modal_onboarding_delay")
            .setTitle("Onboarding Delay (Seconds)");

          const delayInput = new TextInputBuilder()
            .setCustomId("input_onboarding_delay")
            .setLabel("Delay in Seconds (1 - 3600)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. 67")
            .setMaxLength(5)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(delayInput));
          await i.showModal(modal);

          const modalSubmit = await i.awaitModalSubmit({
            filter: m => m.customId === "modal_onboarding_delay" && m.user.id === interaction.user.id,
            time: 60000
          }).catch(() => null);

          if (modalSubmit) {
            const rawVal = modalSubmit.fields.getTextInputValue("input_onboarding_delay").trim();
            const seconds = parseInt(rawVal, 10);
            if (isNaN(seconds) || seconds < 1 || seconds > 3600) {
              await modalSubmit.reply({
                embeds: [errorEmbed("Delay must be a valid number between 1 and 3600 seconds.")],
                ephemeral: true
              });
              return;
            }

            await modalSubmit.deferUpdate();
            await settingsService.setOnboardingDelay(guildId, seconds);
            const updated = renderSetupPage(guildId, currentPage, guildName);
            await interaction.editReply({
              embeds: [updated.embed],
              components: updated.components
            });
          }
          return;
        }

        // Page 3: Set Custom Server Name for Onboarding (Modal)
        if (i.customId === "setup_btn_set_server_name") {
          const modal = new ModalBuilder()
            .setCustomId("modal_set_server_name")
            .setTitle("Set Server Name for Onboarding");

          const currentSettings = settingsService.getSettings(guildId);
          const serverNameInput = new TextInputBuilder()
            .setCustomId("input_server_name")
            .setLabel("Server Name (Max 60 chars)")
            .setStyle(TextInputStyle.Short)
            .setValue(currentSettings.serverName || guildName)
            .setMaxLength(60)
            .setMinLength(1)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(serverNameInput));
          await i.showModal(modal);

          const modalSubmit = await i.awaitModalSubmit({
            filter: m => m.customId === "modal_set_server_name" && m.user.id === interaction.user.id,
            time: 60000
          }).catch(() => null);

          if (modalSubmit) {
            const newServerName = modalSubmit.fields.getTextInputValue("input_server_name").trim();
            await modalSubmit.deferUpdate();
            await settingsService.setServerName(guildId, newServerName);
            const updated = renderSetupPage(guildId, currentPage, guildName);
            await interaction.editReply({
              embeds: [updated.embed],
              components: updated.components
            });
          }
          return;
        }

        // Page 3: Reset Server Name to Default Guild Name
        if (i.customId === "setup_btn_reset_server_name") {
          await settingsService.resetServerName(guildId);
          const updated = renderSetupPage(guildId, currentPage, guildName);
          await i.update({ embeds: [updated.embed], components: updated.components });
          return;
        }

        // Page 4: Toggle Welcome Reply
        if (i.customId === "setup_btn_toggle_welcome") {
          await settingsService.toggleWelcome(guildId);
          const updated = renderSetupPage(guildId, currentPage, guildName);
          await i.update({ embeds: [updated.embed], components: updated.components });
          return;
        }

        // Page 4: Set Welcome Delay (Modal)
        if (i.customId === "setup_btn_set_welcome_delay") {
          const modal = new ModalBuilder()
            .setCustomId("modal_welcome_delay")
            .setTitle("Welcome Reply Delay (Seconds)");

          const delayInput = new TextInputBuilder()
            .setCustomId("input_welcome_delay")
            .setLabel("Delay in Seconds (1 - 300)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. 7")
            .setMaxLength(4)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(delayInput));
          await i.showModal(modal);

          const modalSubmit = await i.awaitModalSubmit({
            filter: m => m.customId === "modal_welcome_delay" && m.user.id === interaction.user.id,
            time: 60000
          }).catch(() => null);

          if (modalSubmit) {
            const rawVal = modalSubmit.fields.getTextInputValue("input_welcome_delay").trim();
            const seconds = parseInt(rawVal, 10);
            if (isNaN(seconds) || seconds < 1 || seconds > 300) {
              await modalSubmit.reply({
                embeds: [errorEmbed("Delay must be a valid number between 1 and 300 seconds.")],
                ephemeral: true
              });
              return;
            }

            await modalSubmit.deferUpdate();
            await settingsService.setWelcomeDelay(guildId, seconds);
            const updated = renderSetupPage(guildId, currentPage, guildName);
            await interaction.editReply({
              embeds: [updated.embed],
              components: updated.components
            });
          }
          return;
        }

        // Page 5: Toggle Bot Mention Reply
        if (i.customId === "setup_btn_toggle_mention") {
          await settingsService.toggleMentionReply(guildId);
          const updated = renderSetupPage(guildId, currentPage, guildName);
          await i.update({ embeds: [updated.embed], components: updated.components });
          return;
        }

        // Page 5: Set Mention Reply Message (Modal)
        if (i.customId === "setup_btn_set_mention_msg") {
          const currentSettings = settingsService.getSettings(guildId);
          const modal = new ModalBuilder()
            .setCustomId("modal_set_mention_msg")
            .setTitle("Set Mention Reply Message");

          const msgInput = new TextInputBuilder()
            .setCustomId("input_mention_msg")
            .setLabel("Reply Message (Use {channel} for channel)")
            .setStyle(TextInputStyle.Paragraph)
            .setValue(currentSettings.mentionMessage || "Need Help? go here: {channel}")
            .setMaxLength(500)
            .setMinLength(1)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(msgInput));
          await i.showModal(modal);

          const modalSubmit = await i.awaitModalSubmit({
            filter: m => m.customId === "modal_set_mention_msg" && m.user.id === interaction.user.id,
            time: 60000
          }).catch(() => null);

          if (modalSubmit) {
            const newMsg = modalSubmit.fields.getTextInputValue("input_mention_msg").trim();
            await modalSubmit.deferUpdate();
            await settingsService.setMentionMessage(guildId, newMsg);
            const updated = renderSetupPage(guildId, currentPage, guildName);
            await interaction.editReply({
              embeds: [updated.embed],
              components: updated.components
            });
          }
          return;
        }

        // Page 5: Reset Mention Reply Message
        if (i.customId === "setup_btn_reset_mention_msg") {
          await settingsService.resetMentionMessage(guildId);
          const updated = renderSetupPage(guildId, currentPage, guildName);
          await i.update({ embeds: [updated.embed], components: updated.components });
          return;
        }

        // Page 5: Target Channel Select Menu
        if (i.isChannelSelectMenu() && i.customId === "setup_select_mention_channel") {
          const selectedChannelId = i.values[0];
          await settingsService.setMentionChannel(guildId, selectedChannelId);
          const updated = renderSetupPage(guildId, currentPage, guildName);
          await i.update({ embeds: [updated.embed], components: updated.components });
          return;
        }

        // Page 5: Manual Target Channel ID (Modal)
        if (i.customId === "setup_btn_manual_mention_channel") {
          const modal = new ModalBuilder()
            .setCustomId("modal_mention_channel_id")
            .setTitle("Set Help Channel by ID");

          const channelInput = new TextInputBuilder()
            .setCustomId("input_mention_channel_id")
            .setLabel("Channel ID")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. 123456789012345678")
            .setMaxLength(25)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput));
          await i.showModal(modal);

          const modalSubmit = await i.awaitModalSubmit({
            filter: m => m.customId === "modal_mention_channel_id" && m.user.id === interaction.user.id,
            time: 60000
          }).catch(() => null);

          if (modalSubmit) {
            const rawChannelId = modalSubmit.fields.getTextInputValue("input_mention_channel_id").replace(/[<#>]/g, "").trim();
            const channel = interaction.guild?.channels.cache.get(rawChannelId) ||
              (await interaction.guild?.channels.fetch(rawChannelId).catch(() => null));

            if (!channel || !(channel instanceof TextChannel)) {
              await modalSubmit.reply({
                embeds: [errorEmbed("Invalid channel ID or not a text channel in this server.")],
                ephemeral: true
              });
              return;
            }

            await modalSubmit.deferUpdate();
            await settingsService.setMentionChannel(guildId, rawChannelId);
            const updated = renderSetupPage(guildId, currentPage, guildName);
            await interaction.editReply({
              embeds: [updated.embed],
              components: updated.components
            });
          }
          return;
        }

        // Page 5: Reset Target Channel to Main Channel
        if (i.customId === "setup_btn_reset_mention_channel") {
          await settingsService.resetMentionChannel(guildId);
          const updated = renderSetupPage(guildId, currentPage, guildName);
          await i.update({ embeds: [updated.embed], components: updated.components });
          return;
        }
      } catch (err: any) {
        if (err?.code !== 10062 && err?.rawError?.code !== 10062) {
          console.error("Error in /setup component collector:", err);
        }
      }
    });

    collector.on("end", async (_collected, reason) => {
      if (reason === "done") return;
      try {
        const latest = renderSetupPage(guildId, currentPage, guildName);
        latest.components.forEach(row => {
          row.components.forEach((c: any) => {
            if ("setDisabled" in c && typeof c.setDisabled === "function") {
              c.setDisabled(true);
            }
          });
        });
        await interaction.editReply({ components: latest.components }).catch(() => {});
      } catch {}
    });
  }
};

export default setupSlashCommand;
