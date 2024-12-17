// const { Events } = require('discord.js');
// const { appendToSheet, getSheetData, getDataById, updateUserData, updateSheetData, createSheet, deleteSheet, checkSheetExists, deleteRowById } = require('../utils/sheetsUtils copy.js');

// module.exports = {
//     name: Events.MessageCreate,
//     async execute(message) {
//         // const toChannel = await message.client.channels.fetch(levelChannelId);
//         if (!message.inGuild() || message.author.bot) return;

//         const sheetName = 'sticky message';
//         const range = 'A:D';
//         const date = new Date().toUTCString();

//         const data = await getDataById(sheetName, 'Hello', range, 'B');
//         console.log(data);

//     }
// };
