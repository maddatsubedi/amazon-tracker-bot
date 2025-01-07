const { guildId } = require('../config.json');
const { removeExpiredRoles, setupRolesDB } = require('../database/models/roles');

const expiresRolesRemovalInterval = 60000; // 1 minute

const removeExpiredRolesFromUser = async (client, roles) => {
    if (!roles || roles.deletedRoles.length ===0) return;
    if (roles.deletedRoles.length !== roles.expiredRoles.length) {
        console.log('Error in removing expired roles of users from database');
        console.log(roles);
    }

    const deletedRoles = roles.deletedRoles;
    const guild = await client.guilds.cache.get(guildId);

    if (!guild) {
        console.log(`Guild not found: ${guildId}`);
        return;
    }

    const members = await guild.members.cache;

    for (let i = 0; i < deletedRoles.length; i++) {
        const roleData = deletedRoles[i];

        const member = await members.get(roleData.user_id);

        if (!member) {
            console.log(`Member not found: ${roleData.user_id}`);
            continue;
        }

        const role = await guild.roles.cache.get(roleData.role_id);

        if (!role) {
            console.log(`Role not found: ${roleData.role_id}`);
            continue;
        }

        await member.roles.remove(role);
        console.log(`Removed role ${role.name} from ${member.user.username}`);
    }
    
}


const runExpiredRolesRemoval = async (client) => {
    
    setupRolesDB();

    while (true) {
        const removedRoles = removeExpiredRoles();
        await removeExpiredRolesFromUser(client, removedRoles);
        await new Promise(resolve => setTimeout(resolve, expiresRolesRemovalInterval));
    }

};

module.exports = {
    runExpiredRolesRemoval
}