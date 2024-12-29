const { EventEmitter } = require('events');
const priceChangeEmitter = new EventEmitter();

module.exports = priceChangeEmitter;