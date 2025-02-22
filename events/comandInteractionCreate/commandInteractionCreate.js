const { Events } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const { checkRole } = require('../../utils/helpers');
const { getConfig } = require('../../database/models/config');
const { simpleEmbed } = require('../../embeds/generalEmbeds');
const { validateAdminAndGuild } = require('../../utils/discordValidators');
const { otherGuilds1 } = require('../../config.json');

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

		// Validate guild and admin commands
		const validate = await validateAdminAndGuild(interaction);
		if (validate && validate.error) {
			if (validate.embed) {
				return await interaction.reply({ embeds: [validate.embed] });
			}
			return;
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