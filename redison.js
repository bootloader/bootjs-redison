const config = require("@bootloader/config");
const IORedis = require("ioredis");
const MockIORedis = require("./MockIORedis");

const { RedisMemoryServer } = require("redis-memory-server");
const redisHost =
  config.getIfPresent("redis.host") || config.getIfPresent("mry.redis.host");
const redisClient =
  config.getIfPresent("redis.client") ||
  config.getIfPresent("mry.redis.client") ||
  "redis";

const isRedisMock = redisHost == "<host>" || !redisHost;

async function connectMock(IORedisClient) {
  let redisServer = await RedisMemoryServer.create(); // Create in-memory Redis
  const host = await redisServer.getHost(); // Get host (127.0.0.1)
  const port = await redisServer.getPort(); // Get dynamic port
  console.log(`Connecting to in-memory Redis`);
  await IORedisClient.connect({ host, port });
}

const client = (function (host) {
  let ioredis = "ioredis";
  if (redisClient == ioredis) {
    if (isRedisMock) {
      console.log(`## ioredis-mock:connection:${host}`);
      let IORedisClient = new MockIORedis();
      connectMock(IORedisClient);
      return IORedisClient;
    } else {
      console.log(`## ioredis:connection:${host}`);
      return new IORedis(
        `redis://${host}:${
          config.getIfPresent("redis.port") ||
          config.getIfPresent("mry.redis.port")
        }`
      );
    }
  } else {
    if (isRedisMock) {
      console.log(`## redis-mock:connection:${host}`);
      const redisMock = require("redis-mock");
      return redisMock.createClient();
    } else {
      console.log(`## redis-mock:connection:${host}`);
      let redis = require("redis");
      return redis.createClient({
        url: `redis://${host}:${
          config.getIfPresent("redis.port") ||
          config.getIfPresent("mry.redis.port")
        }`,
      });
    }
  }
})(redisHost);

client.on("error", (err) => console.error("Redis Client Error", err));
client.on("connect", () => console.log("Redis Client connected"));
if (typeof client.connect == "function") {
  console.log("=====connecting");
  if (redisClient == "redis") {
    client.connect();
  }
}
client.set("conneted_on", new Date().toISOString());

module.exports = client;
