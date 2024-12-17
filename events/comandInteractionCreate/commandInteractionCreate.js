const { Events } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { checkRole } = require('../../utils/functions');
const { getConfig } = require('../../database/models/config');
const { simpleEmbed } = require('../../embeds/generalEmbeds');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {

		if (!interaction.isChatInputCommand()) {
			return;
		}

		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		const adminRoleID = getConfig('adminRoleID');
		const errorEmbed = simpleEmbed({description: '❌ You do not have permission to run this command', color: 'Red' });

		if (command.isAdmin && !checkRole(interaction.member, adminRoleID)) {
			return await interaction.reply({embeds: [errorEmbed]});
		}

		try {
			if ('execute' in command) {
				await command.execute(interaction);
			} else if ('run' in command) {
				await command.run(interaction);
			} else {
				console.log("Error running command");
			}
		} catch (error) {
			console.error(`Error executing ${interaction.commandName}`);
			console.error(error);
		}
	},
};