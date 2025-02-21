const { setIsPolling, unsetIsPolling, isPolling } = require('../database/models/config');
const { simpleEmbed } = require('../embeds/generalEmbeds');
const { parseTimeToMilliseconds } = require('../utils/helpers');
const { pollingMain } = require('../utils/keepaDealsApi');

async function initPolling(client, interaction) {
    setIsPolling();
    // setupPolling();
    const result = await pollingMain(client, interaction);
    if (result.abort) {
        unsetIsPolling();
    }
    return result;
}

async function reInitPolling(client, interaction) {
    if (!isPolling()) {
        const result = await initPolling(client, interaction);

        if (result.abort) {
            if (interaction) {
                const errorEmbed = simpleEmbed({
                    description: `**Polling has been aborted**`,
                    color: 'Red'
                }).addFields(
                    { name: '> Reason', value: `> ${result.abortMessage}` }
                );
                await interaction.editReply({ embeds: [errorEmbed] });
            }
        }

        return result;
    } else {

        if (interaction) {
            const errorEmbed = simpleEmbed({
                description: `**Polling is already running**`,
                color: 'Yellow'
            });
            await interaction.editReply({ embeds: [errorEmbed] });
        }

        return {
            abort: "POLLING_ALREADY_RUNNING",
            abortMessage: "Polling is already running"
        };
    }
}

module.exports = {
    initPolling,
    reInitPolling
}