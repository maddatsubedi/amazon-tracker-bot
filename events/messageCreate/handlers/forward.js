const { EmbedBuilder } = require("discord.js");
const { getMultiValueGuildConfig } = require("../../../database/models/guildConfig");
const { generateRandomHexColor } = require("../../../utils/helpers");

const runMessageForward = async (message) => {

    try {

        const { guild, channel, content, author } = message;
        const guildId = guild.id;
        const channelId = channel.id;

        const forwardConfigs = getMultiValueGuildConfig(guildId, 'forwardConfig');
        // console.log(forwardConfig);
        if (!forwardConfigs || forwardConfigs.length === 0) {
            return;
        };

        for (const forwardConfig of forwardConfigs) {
            const [sourceChannel, destinationServerAndChannel] = forwardConfig.split(':');
            const [destinationServerId, destinationChannelId] = destinationServerAndChannel.split('/');
            if (sourceChannel === channelId) {
                const destinationGuild = await message.client.guilds.fetch(destinationServerId).catch(() => null);
                if (!destinationGuild) {
                    console.log(`Destination guild not found: ${destinationServerId}`);
                    return;
                };

                const destinationChannel = await destinationGuild.channels.fetch(destinationChannelId).catch(() => null);
                if (!destinationChannel) {
                    console.log(`Destination channel not found: ${destinationChannelId}`);
                    return;
                };

                const imageUrls = message.attachments.filter(a => a.contentType?.startsWith('image/')).map(a => a.url);

                if (imageUrls.length === 0) {
                    return;
                }

                const randomHex = generateRandomHexColor();

                for (let i = 0; i < imageUrls.length; i++) {
                    const imageUrl = imageUrls[i];
                    const embed = new EmbedBuilder()
                        .setColor(randomHex)
                        .setImage(imageUrl);

                    if (i === 0) {
                        embed.setAuthor({ name: author.tag, iconURL: author.displayAvatarURL() })
                        if (content) {
                            embed.setDescription(`> **${content}**`);
                        }
                    }

                    if (i === imageUrls.length - 1) {
                        embed.setFooter(
                            { text: `${guild.name} | #${channel.name}`, iconURL: guild.iconURL() }
                        ).setTimestamp();
                    }

                    await destinationChannel.send({ embeds: [embed] });
                }

            }
        }

    } catch (error) {
        console.error("An error occurred in runMessageForward: ", error);
    }

};

module.exports = {
    runMessageForward
};