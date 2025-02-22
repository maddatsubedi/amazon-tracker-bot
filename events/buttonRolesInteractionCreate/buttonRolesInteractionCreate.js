const { Events, MessageFlags } = require('discord.js');
const { simpleEmbed } = require('../../embeds/generalEmbeds');
const { getGuildConfig } = require('../../database/models/guildConfig');
const { getSubscriptionRoles } = require('../../database/models/subscriptionRoles');
const { getSubscription } = require('../../database/models/subscription');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {

		if (!interaction.isButton()) {
			return;
		}

		const customId = interaction.customId;
		const guildId = interaction.guild.id;

		const regex = /^button_role:(\d+)$/;

		if (!customId || !regex.test(customId)) {
			return;
		}

		const roleId = customId.split(':')[1];

		const premiumRoleId = await getGuildConfig(guildId, 'premium_role_id');
		const subscriptionRoles = getSubscriptionRoles(guildId);

		if (!premiumRoleId) {
			const errorEmbed = simpleEmbed({
				description: `**Premium Role not set**\n\n> Please contact support`,
				color: 'Red',
			});
			return await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
		}

		const role = await interaction.guild.roles.cache.get(roleId);

		if (!role) {
			const errorEmbed = simpleEmbed({
				description: `**Role not found**\n\n> Please contact support`,
				color: 'Red',
			});
			return await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
		}

		const member = await interaction.member;

		const hasRole = member.roles.cache.has(roleId);

		let flag = false;

		if (hasRole) {
			await member.roles.remove(roleId).catch(() => {
				const errorEmbed = simpleEmbed({
					description: `**I do not have required permission for the role: ${role.id !== interaction.guild.id ? `<@&${role.id}>` : role.name}**\n\n> Please contact support`,
					color: 'Red',
				});
				flag = true;
				return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
			});

			if (flag) {
				return;
			}

			const embed = simpleEmbed({
				description: `**Role removed: <@&${role.id}>**`,
				color: 'Orange',
			});
			return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		}

		const isSubscriptionRole = subscriptionRoles.some((role) => role.role_id === roleId);
		const userSubscription = getSubscription(member.id, guildId);

		if (isSubscriptionRole && !userSubscription) {
			const errorEmbed = simpleEmbed({
				description: `**You do not have an active subscription**\n\n> This role: <@&${role.id}> is only available for premium users`,
				color: 'Red',
			});
			return await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
		}

		await member.roles.add(roleId).catch(() => {
			const errorEmbed = simpleEmbed({
				description: `**I do not have required permission for the role: <@&${role.id}>**\n\n> Please contact support`,
				color: 'Red',
			});
			flag = true;
			return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
		});

		if (flag) {
			return;
		}

		const embed = simpleEmbed({
			description: `**Role added: <@&${role.id}>**`,
			color: 'Green',
		});
		return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
	},
};