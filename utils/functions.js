function checkRole(member, roleId) {
    return member.roles.cache.has(roleId);
}

function checkRolesFromList(member, roleIds) {
    return roleIds.some(roleId => member.roles.cache.has(roleId));
}

const validateRange = (range) => {
    const rangeRegex = /^(?:[1-9][0-9]?|100)-(?:[1-9][0-9]?|100)$/;
    
    if (rangeRegex.test(range)) {
        // Extract the values of a and b
        const [i, f] = range.split('-').map(Number);

        // Ensure b is greater than a
        if (f > i) {
            return { valid: true, i, f };
        } else {
            return { valid: false };
        }
    } else {
        return { valid: false};
    }
};

module.exports = { checkRole, checkRolesFromList, validateRange};