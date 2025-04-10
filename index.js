const redison = require('./redison');
const cachebox = require('./cachebox');
const rqueue = require('./rqueue');
const info = require('./info');
const config = require('@bootloader/config');

module.exports = {
  client: redison,
  redis: redison,
  cachebox: cachebox,
  CacheBox: cachebox,
  rqueue: rqueue,
  RQueue: rqueue,
  rQueue: rqueue,
  info,
  waitForReady: async function () {
    if (typeof redison?.waitForReady == 'function') {
      return await redison.waitForReady();
    }
    return await redison.waitForReady();
  },
};
