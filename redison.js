const config = require("@bootloader/config");
const IORedis = require("ioredis");
const MockIORedis = require("./MockIORedis");

const redisHost =
  config.getIfPresent("redis.host") || config.getIfPresent("mry.redis.host");
const redisClient =
  config.getIfPresent("redis.client") ||
  config.getIfPresent("mry.redis.client") ||
  "redis";

const isRedisMock = redisHost == "<host>" || !redisHost;

async function startRedisServer() {
  try {
    const { RedisServer } = require("@redis/server");
    let server = new RedisServer();
    await server.open();
    console.error("✅ package(@redis/server) found!");
    return { host: server.host, port: server.port };
  } catch (err1) {
    console.info("❌ package(@redis/server) not found!");
    try {
      const { RedisMemoryServer } = require("redis-memory-server");
      let redisServer = await RedisMemoryServer.create(); // Create in-memory Redis
      console.error("✅ package(redis-memory-server) found!");
      return {
        host: await redisServer.getHost(),
        port: await redisServer.getPort(),
      };
    } catch (err2) {
      console.error("❌ No in-memory Redis package found!");
      console.error(
        "💡 Install either `@redis/server` or `redis-memory-server` globally:"
      );
      console.error("npm install -g @redis/server");
      console.error("OR (only for Non-Windows)");
      console.error("npm install -g redis-memory-server");
    }
  }
}

async function connectMock(IORedisClient) {
  const { host, port } = await startRedisServer(); // Create in-memory Redis
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
      return new IORedis({
        host,
        port:
          config.getIfPresent("redis.port") ||
          config.getIfPresent("mry.redis.port"),
        maxRetriesPerRequest: null,
      });
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
