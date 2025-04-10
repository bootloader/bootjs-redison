const config = require('@bootloader/config');
const IORedis = require('ioredis');
const MockIORedis = require('./MockIORedis');
const { requireGlobal, system } = require('@bootloader/utils');
const info = require('./info');

async function startRedisServer() {
  try {
    const RedisServer = requireGlobal('redis-server');
    console.error('✅ package(redis-server) found!');
    let server = new RedisServer(6379);
    await server.open();
    console.error('✅ package(redis-server) connected!');
    return { host: server.host, port: server.port };
  } catch (error) {
    console.info('❌ package(redis-server) not found!');
    throw error;
  }
}

async function startRedisInMemoryServer() {
  try {
    const { RedisMemoryServer } = requireGlobal('redis-memory-server');
    console.error('✅ package(redis-memory-server) found!');
    let redisServer = await RedisMemoryServer.create(); // Create in-memory Redis
    console.error('✅ package(redis-memory-server) connected!');
    return {
      host: await redisServer.getHost(),
      port: await redisServer.getPort(),
    };
  } catch (error) {
    console.error('❌ No in-memory Redis package found!');
    return await startRedisServer();
  }
}

async function startRedisLocalServer() {
  try {
    if (system.isWindows()) {
      return await startRedisServer();
    } else {
      return await startRedisInMemoryServer();
    }
  } catch (err1) {
    console.error('💡 Install either `redis-server` or `redis-memory-server` globally:');
    console.error('(for Linux/Mac)');
    console.error('npm install -g redis-memory-server');
    console.error('OR (only for Non-Windows)');
    console.error('npm install -g redis-server');
  }
}

async function connectMock(IORedisClient) {
  console.log(`⚠️ Connecting to in-memory Mock Redis`);
  const options = await startRedisLocalServer(); // Create in-memory Redis
  if (options) {
    await IORedisClient.connect(options);
  }
}

const client = (function ({ host, port, name, isMock, isIORedis }) {
  if (info.isIORedis) {
    if (info.isMock) {
      console.log(`## ioredis-mock:connection:${info.host}`);
      let IORedisClient = new MockIORedis();
      connectMock(IORedisClient);
      return IORedisClient;
    } else if (info.host) {
      console.log(`## ioredis:connection:${info.host}`);
      return new IORedis({
        host,
        port,
        maxRetriesPerRequest: null,
      });
    }
  } else if (info.host) {
    if (info.isMock) {
      console.log(`## redis-mock:connection:${info.host}`);
      const redisMock = require('redis-mock');
      return redisMock.createClient();
    } else {
      console.log(`## redis-mock:connection:${info.host}`);
      let redis = require('redis');
      return redis.createClient({
        url: `redis://${info.host}:${info.port}`,
      });
    }
  }

  console.error(`
**************** ⚠️  How to Fix ? ****************************
## in local.properties
redis.host=<host>
redis.port=<port>

## or manually via config in code before importing redison
config.set('redis.host', '<host>');
config.set('redis.port', '<port>');
*********************************************************
    `);
  throw new Error('❌ Redis config MISSING');
})(info);

if (client) {
  client.waitForReady = function () {
    return new Promise((resolve, reject) => {
      client.on('error', err => {
        console.error('Redis Client Error', err);
        reject(err);
      });
      client.on('connect', () => {
        console.log('Redis Client connected');
        resolve(client);
      });
    });
  };
  if (typeof client.connect == 'function') {
    //console.log("=====connecting");
    if (info.name == 'redis') {
      client.connect();
    }
  }
  client.set('conneted_on', new Date().toISOString());
}

module.exports = client;
