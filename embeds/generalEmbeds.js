const { EmbedBuilder } = require('discord.js');
const { getAvailabeLocales } = require('../utils/helpers');

const simpleEmbed = ({ title, color, description, setTimestamp, footer, setFooterImage }) => {
	const embed = new EmbedBuilder()

	if (title) embed.setTitle(title);
	if (color) embed.setColor(color);
	if (description) embed.setDescription(description);
	if (setTimestamp) embed.setTimestamp();
	if (footer) embed.setFooter({ text: footer, iconURL: setFooterImage ? 'https://i.imgur.com/AfFp7pu.png' : null });

	return embed;
}

const availableLocales = getAvailabeLocales();

const localesString = availableLocales?.map(locale => `\`${locale}\``).join(`\n`);

const localesEmbed = (title) => {
	const embed = simpleEmbed({
		description: `${title ? `${title}\n\n` : ``}**Following domains are supported:**\n\n>>> **${localesString}**`, color: 'Red'
	});

	return embed;
}

module.exports = {
	simpleEmbed,
	localesEmbed,
};