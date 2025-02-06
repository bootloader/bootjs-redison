const client = require('./redison');
const cachebox = require('./cachebox');
const config = require('@bootloader/config');

module.exports = {
    client, redis : client,
    cachebox
}
