const { EmbedBuilder } = require('discord.js');

const simpleEmbed = ({ title, color, description, setTimestamp, footer, setFooterImage }) => {
	const embed = new EmbedBuilder()

	if (title) embed.setTitle(title);
	if (color) embed.setColor(color);
	if (description) embed.setDescription(description);
	if (setTimestamp) embed.setTimestamp();
	if (footer) embed.setFooter({ text: footer, iconURL: setFooterImage ? 'https://i.imgur.com/AfFp7pu.png' : null });

	return embed;
}


module.exports = {
	simpleEmbed,
};