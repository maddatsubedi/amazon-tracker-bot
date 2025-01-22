const { Events } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { checkRole } = require('../../utils/helpers');
const { getConfig } = require('../../database/models/config');
const { simpleEmbed } = require('../../embeds/generalEmbeds');
const { validateAdminAndGuild } = require('../../utils/discordValidators');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {

		if (!interaction.isButton()) {
			return;
		}

		const customId = interaction.customId;

		const regex = /^button_role:(\d+)$/;

		if (!customId || !regex.test(customId)) {
			return;
		}

		const roleId = customId.split(':')[1];

		const role = await interaction.guild.roles.cache.get(roleId);

		if (!role) {
			const errorEmbed = simpleEmbed({
				description: `**Role not found**\n\n> Please contact support`,
				color: 'Red',
			});
			return await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
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
				return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
			});

			if (flag) {
				return;
			}

			const embed = simpleEmbed({
				description: `**Role removed: <@&${role.id}>**`,
				color: 'Green',
			});
			return await interaction.reply({ embeds: [embed], ephemeral: true });
		}

		await member.roles.add(roleId).catch(() => {
			const errorEmbed = simpleEmbed({
				description: `**I do not have required permission for the role: <@&${role.id}>**\n\n> Please contact support`,
				color: 'Red',
			});
			flag = true;
			return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
		});

		if (flag) {
			return;
		}

		const embed = simpleEmbed({
			description: `**Role added: <@&${role.id}>**`,
			color: 'Green',
		});
		return await interaction.reply({ embeds: [embed], ephemeral: true });
	},
};