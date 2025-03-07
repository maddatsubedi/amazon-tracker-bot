const { guildId } = require('../config.json');
const { getGuildConfig } = require('../database/models/guildConfig');
const { removeExpiredSubscriptions } = require('../database/models/subscription');
const { getSubscriptionRoles } = require('../database/models/subscriptionRoles');
const { simpleEmbed } = require('../embeds/generalEmbeds');
const { logTypesChannelMap } = require('./dbUtils.json');

const expiresSubscriptionsRemovalInterval = 60000; // 1 minute

const removeExpiredSubscriptionFromUser = async (client, roles) => {
    if (!roles || roles.deletedSubscriptions.length === 0) return;
    if (roles.deletedSubscriptions.length !== roles.expiredSubscriptions.length) {
        console.log('Error in removing expired roles of users from database');
        console.log(roles);
    }

    const deletedSubscriptions = roles.deletedSubscriptions;

    for (let i = 0; i < deletedSubscriptions.length; i++) {

        const subscriptionData = deletedSubscriptions[i];

        const guildId = subscriptionData.guild_id;
        const userId = subscriptionData.user_id;
        const premiumRoleId = getGuildConfig(guildId, 'premium_role_id');

        try {

            const guild = await client.guilds.cache.get(guildId);

            if (!guild) {
                console.log(`Guild not found: ${guildId}`);
                continue;
            }

            const member = await guild.members.fetch(userId).catch(() => null);

            if (!member) {
                console.log(`Member not found: ${subscriptionData.user_id}`);
                continue;
            }

            const userRoles = await member.roles.cache;
            const userHasRole = await userRoles.has(premiumRoleId);

            const premiumRole = await guild.roles.cache.get(premiumRoleId);

            if (!premiumRole) {
                console.log(`Premium role not found: ${premiumRoleId}`);
                // continue;
            }

            let premiumRoleFlag = false;

            await member.roles.remove(premiumRole).catch((error) => {
                console.log(`Error removing premium role ${premiumRole.name} from ${member.user.username}`);
                console.log(error.message);
                premiumRoleFlag = true;
            });

            // const premiumRoleStatus = premiumRoleFlag ? 'Failed To Remove' : premiumRole ? 'Removed' : 'Not Found';
            const premiumRoleStatus = !premiumRole ? `Not Found` : premiumRoleFlag ? `<@&${premiumRoleId}> (Failed To Remove)` : userHasRole ? `<@&${premiumRoleId}> (Removed)` : `<@&${premiumRoleId}> (User Does Not Have Role)`;

            const subscriptionRoles = getSubscriptionRoles(guildId);
            const removedSubscriptionRoles = [];
            const errorSubscriptionRoles = [];

            if (subscriptionRoles) {
                const subscriptionRoleIds = new Set(subscriptionRoles.map(role => role.role_id));
                const userRoles = member.roles.cache;

                for (const role of userRoles.values()) {
                    if (subscriptionRoleIds.has(role.id)) {
                        let flag = false;
                        await member.roles.remove(role).catch((error) => {
                            console.log(`Error removing subscription role ${role.name} from ${member.user.username}`);
                            console.log(error.message);
                            errorSubscriptionRoles.push(role.id);
                            flag = true;
                        });

                        if (flag) continue;

                        removedSubscriptionRoles.push(role.id);
                        console.log(`Removed subscription role ${role.name} (id: ${role.id}) from ${member.user.username}`);
                    }
                }
            } else {
                console.log(`No subscription roles found for guild: ${guildId}`);
            }

            const logMessageEmbed = simpleEmbed({
                title: 'Subscription Expired',
                description: `Subscription removed from user`,
                color: 'Yellow',
                setTimestamp: true,
            }).addFields(
                { name: 'User', value: `<@${userId}>`, inline: true },
                { name: 'Role', value: premiumRoleStatus, inline: true },
                { name: 'Added At', value: `\`${subscriptionData.added_at}\``, inline: true },
                { name: 'Expires At', value: `\`${subscriptionData.expires_at}\``, inline: true },
                { name: 'Duration Set', value: `\`${subscriptionData.duration}\``, inline: true },
            ).setFooter({
                text: `${guild.name} | Subscription Logs`,
                iconURL: guild.iconURL(),
            }).setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

            if (removedSubscriptionRoles.length > 0) {
                const removedSubscriptionRolesString = removedSubscriptionRoles.map(role => `<@&${role}>`).join(', ');
                logMessageEmbed.addFields(
                    { name: 'Removed Roles', value: removedSubscriptionRolesString, inline: false }
                );
            }

            if (errorSubscriptionRoles.length > 0) {
                const errorSubscriptionRolesString = errorSubscriptionRoles.map(role => `<@&${role}>`).join(', ');
                logMessageEmbed.addFields(
                    {
                        name: 'Error Occurred While Removing These Roles',
                        value: errorSubscriptionRolesString,
                        inline: false
                    }
                );
            }

            const logMessage = { embeds: [logMessageEmbed] };

            await log(logMessage, guildId, client, "subscription");
            // console.log(`Removed premium role ${premiumRole.name} from ${member.user.username}`);

        } catch (error) {
            console.log(`Error removing premium role from user, user: ${userId}, guildId: ${guildId}`);
            console.log(error.message);
        }
    }

}


const runExpiredSubscriptionsRemoval = async (client) => {

    while (true) {
        const removedSubscriptions = removeExpiredSubscriptions();
        await removeExpiredSubscriptionFromUser(client, removedSubscriptions);
        await new Promise(resolve => setTimeout(resolve, expiresSubscriptionsRemovalInterval));
    }

};

const log = async (message, guildId, client, type) => {

    try {

        const logChannelAccessor = logTypesChannelMap[type];
        const guild = await client.guilds.cache.get(guildId);

        if (!guild) {
            console.log(`Guild not found: ${guildId}`);
            return;
        }

        const logChannelId = getGuildConfig(guildId, logChannelAccessor);

        if (!logChannelId) {
            console.log(`Log channel not found for type: ${type}`);
            return;
        }

        const logChannel = await guild.channels.cache.get(logChannelId);

        if (!logChannel) {
            console.log(`Log channel not found: ${logChannelId}`);
            return;
        }

        await logChannel.send(message);

    } catch (error) {
        console.log(`Error while logging, message: ${message}, guildId: ${guildId}`);
        console.log(error.message);
    }

}

// Helper function to safely format embed field values
function safeField(text) {
    const MAX_LENGTH = 1024;
    const MIN_RESERVED_SUFFIX = 25;
    if (text.length <= MAX_LENGTH) return text;

    // Split items by comma and space
    const itemsArray = text.split(', ');
    let result = "";
    let count = 0;
    for (const item of itemsArray) {
        // Check if adding the next item would exceed the limit
        if ((result + item + ', ').length > MAX_LENGTH - MIN_RESERVED_SUFFIX) break;
        result += item + ', ';
        count++;
    }
    // Remove the trailing comma and space
    result = result.slice(0, -2);
    const remaining = itemsArray.length - count;
    return `${result} ... and ${remaining} more.`;
}

const premiumServerLock = async (guild, premiumRoleId) => {

    try {

        const guildId = guild.id;

        const publicChannelID = getGuildConfig(guildId, 'publicChannelID');
        const privateChannels = getGuildConfig(guildId, 'privateChannels');
        const privateChannelsArray = privateChannels ? privateChannels.split(',') : [];

        const publicChannel = guild.channels.cache.get(publicChannelID);

        const fullPromises = [];

        for (const channel of guild.channels.cache.values()) {
            if (channel.id === publicChannelID) continue;
            if (privateChannelsArray.includes(channel.id)) continue;

            fullPromises.push(
                channel.permissionOverwrites?.edit(premiumRoleId, { ViewChannel: true }),
                channel.permissionOverwrites?.edit(guild.roles.everyone, { ViewChannel: false })
            );
        }

        await Promise.all(fullPromises);
        // console.log("Full");

        // PBC (Public Channel)
        if (publicChannel) {
            try {
                await publicChannel.permissionOverwrites?.edit(premiumRoleId, { ViewChannel: null });
                await publicChannel.permissionOverwrites?.edit(guild.roles.everyone, { ViewChannel: null });
                // console.log("PBC");
            } catch (error) {
                console.error(`[LOCK_PREMIUM : PBC] : Error setting permissions for channel ${publicChannel.name} in guild ${guild.name}`);
            }
        }

        // PRCS (Private Channels)
        const prcsPromises = [];

        for (const channelId of privateChannelsArray) {
            const channel = guild.channels.cache.get(channelId);
            if (!channel) continue;

            prcsPromises.push(
                channel.permissionOverwrites?.edit(premiumRoleId, { ViewChannel: null }),
                channel.permissionOverwrites?.edit(guild.roles.everyone, { ViewChannel: false })
            );
        }

        await Promise.all(prcsPromises);

        const privateChannelsList = privateChannelsArray.map(channel => `<#${channel}>`).join(', ');

        const embed = simpleEmbed({
            footer: `${guild.name} | Premium Lock`,
            title: 'Server Locked',
            color: 'Random',
        }).addFields(
            { name: 'Premium Role', value: `> <@&${premiumRoleId}>` },
        );

        if (publicChannel) {
            embed.addFields(
                { name: 'Public Channel', value: `> <#${publicChannelID}>` },
            );
        }

        if (privateChannelsList.length > 0) {
            embed.addFields(
                { name: 'Private Channels', value: `> ${safeField(privateChannelsList)}` },
            );
        }

        return {
            success: true,
            embed,
        }

    } catch (error) {
        console.log(`Error while locking server: ${error.message}`);
        return {
            error: "LOCK_SERVER_ERROR",
        }
    }
}

const premiumServerUnlock = async (guild, premiumRoleId) => {

    try {

        const guildId = guild.id;

        const publicChannelID = getGuildConfig(guildId, 'publicChannelID');
        const privateChannels = getGuildConfig(guildId, 'privateChannels');
        const privateChannelsArray = privateChannels ? privateChannels.split(',') : [];

        const publicChannel = guild.channels.cache.get(publicChannelID);

        const fullPromises = [];

        for (const channel of guild.channels.cache.values()) {
            if (channel.id === publicChannelID) continue;
            if (privateChannelsArray.includes(channel.id)) continue;

            fullPromises.push(
                channel.permissionOverwrites?.edit(premiumRoleId, { ViewChannel: null }),
                channel.permissionOverwrites?.edit(guild.roles.everyone, { ViewChannel: null })
            );
        }

        await Promise.all(fullPromises);
        // console.log("Full");

        // PBC (Public Channel)
        if (publicChannel) {
            try {
                await publicChannel.permissionOverwrites?.edit(premiumRoleId, { ViewChannel: null });
                await publicChannel.permissionOverwrites?.edit(guild.roles.everyone, { ViewChannel: null });
                // console.log("PBC");
            } catch (error) {
                console.error(`[LOCK_PREMIUM : PBC] : Error setting permissions for channel ${publicChannel.name} in guild ${guild.name}`);
            }
        }

        // PRCS (Private Channels)
        const prcsPromises = [];

        for (const channelId of privateChannelsArray) {
            const channel = guild.channels.cache.get(channelId);
            if (!channel) continue;

            prcsPromises.push(
                channel.permissionOverwrites?.edit(premiumRoleId, { ViewChannel: null }),
                channel.permissionOverwrites?.edit(guild.roles.everyone, { ViewChannel: false })
            );
        }

        await Promise.all(prcsPromises);

        const privateChannelsList = privateChannelsArray.map(channel => `<#${channel}>`).join(', ');

        const embed = simpleEmbed({
            footer: `${guild.name} | Premium Lock`,
            title: 'Server Unlocked',
            color: 'Random',
        }).addFields(
            { name: 'Premium Role', value: `> <@&${premiumRoleId}>` },
        );

        if (publicChannel) {
            embed.addFields(
                { name: 'Public Channel', value: `> <#${publicChannelID}>` },
            );
        }

        if (privateChannelsList.length > 0) {
            embed.addFields(
                { name: 'Private Channels', value: `> ${safeField(privateChannelsList)}` },
            );
        }

        return {
            success: true,
            embed,
        }

    } catch (error) {
        console.log(`Error while unlocking server: ${error.message}`);
    }
}

module.exports = {
    runExpiredSubscriptionsRemoval,
    log,
    safeField,
    premiumServerLock,
    premiumServerUnlock,
}