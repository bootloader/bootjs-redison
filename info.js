const config = require('@bootloader/config');

const redisHost = config.getIfPresent('redis.host') || config.getIfPresent('mry.redis.host');
const redisPort = config.getIfPresent('redis.port') || config.getIfPresent('mry.redis.port');
const redisClient = config.getIfPresent('redis.client') || config.getIfPresent('mry.redis.client') || 'redis';

module.exports = {
  host: redisHost,
  port: redisPort,
  name: redisClient,
  isMock: ['<host>', '<localhost>', '<mock>'].indexOf(redisHost) >= 0, // || !redisHost,
  isNone: ['<none>', '<disabled>', '<na>', '<disconnected>'].indexOf(redisHost) >= 0, // || !redisHost,
  isIORedis: redisClient == 'ioredis',
};
