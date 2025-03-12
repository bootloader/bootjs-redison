const config = require("@bootloader/config");

const redisHost =
  config.getIfPresent("redis.host") || config.getIfPresent("mry.redis.host");
const redisClient =
  config.getIfPresent("redis.client") ||
  config.getIfPresent("mry.redis.client") ||
  "redis";


module.exports = {
    host : redisHost,
    name : redisClient,
    isMock : redisHost == "<host>" || !redisHost,
    isIORedis : redisClient == "ioredis"
}
