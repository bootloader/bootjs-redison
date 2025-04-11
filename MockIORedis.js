const IORedis = require('ioredis');
var console = require("@bootloader/log4js").getLogger('redison');

class MockIORedis {
  constructor() {
    this.client = null;
    this.connected = false;
    this.queue = [];
    this.url = null;
    this.options = null;
    this.events = {};
    this.$ready = null;

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === 'connect') {
          return url => this.connect(url);
        }
        if (prop === 'disconnect') {
          return () => this.disconnect();
        }
        if (prop === 'waitForReady') {
          return () => this.waitForReady();
        }
        if (prop === 'setConfig') {
          return (...args) => this.setConfig(...args);
        }
        if (prop === 'on') {
          return (...args) => this.on(...args);
        }
        if (prop === 'then') {
          return (...args) =>
            console.log('⚠️ Client is NOT PROMISE', ...args, this.getCallerScript(new Error('-----')));
        }
        return (...args) => this._callMethod(prop, args);
      },
    });
  }

  getCallerScript(_err, stackIndex = 2) {
    let err = _err;
    if (!err) {
      err = new Error();
      stackIndex++;
    }
    //console.error(err);
    const stack = err.stack.split('\n');

    // The 3rd line in the stack trace usually contains the caller
    const callerLine = stack[stackIndex];

    const match = callerLine.match(/\((.*):\d+:\d+\)/);
    return match ? match[1] : 'Unknown caller';
  }

  setConfig(options) {
    this.options = options;
    return this;
  }

  async connect() {
    let { host = '127.0.0.1', port = 6379, maxRetriesPerRequest = null } = this.options || {};
    if (this.connected) {
      console.warn('⚠️ Redis is already connected.');
      return;
    }
    const redisURI = `redis://${host}:${port}`;

    if (!redisURI) {
      console.error('❌ Redis URL is required to connect!');
      return;
    }

    console.log(`🚀 Connecting to Redis at ${redisURI}...`);
    this.url = redisURI;
    this.client = new IORedis({
      host: host,
      port: port,
      maxRetriesPerRequest: maxRetriesPerRequest, // ✅ Fix: Required for BullMQ
    });
    this.connected = true;

    Object.keys(this.events).map(event => {
      const list = this.events[event];
      for (const callback of list) {
        this.client.on(event, callback);
      }
    });

    this.on('error', err => console.error('Redis Error:', err));
    this.on('connect', (...args) => {
      console.log('✅ Redis Client connected');
      this._flushQueue();
    });
  }

  async disconnect() {
    if (this.client) {
      console.log('🔴 Disconnecting from Redis...');
      await this.client.quit(); // `quit()` is better than `disconnect()` for cleanup
      this.client = null;
      this.connected = false;
    }
  }

  on(event, callback) {
    if (this.client) {
      this.client.on(event, callback);
    } else {
      this.events[event] = this.events[event] || [];
      this.events[event].push(callback);
    }
  }

  waitForReady() {
    if (!this.$ready) {
      console.log('⚠️ Waiting for Redis to be ready...');
      this.$ready = new Promise(resolve => {
        const checkInterval = setInterval(() => {
          console.log('⚠️ Checking Redis connection...', this.connected);
          if (this.connected) {
            clearInterval(checkInterval);
            resolve(this.client);
          }
        }, 100); // Check every 100ms
      });
    }
    return this.$ready;
  }

  _flushQueue() {
    if (!this.client) return;
    this.queue.forEach(({ prop, args, resolve, reject }) => {
      try {
        const result = this.client[prop](...args);
        if (result && typeof result.then === 'function') {
          result.then(resolve).catch(reject);
        } else {
          resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
    this.queue = [];
  }

  _callMethod(prop, args) {
    if (!this.client) {
      console.warn(`⚠️ Redis is not connected yet! Queuing ${prop} call.`);
      return new Promise((resolve, reject) => {
        this.queue.push({ prop, args, resolve, reject });
      });
    }

    try {
      const result = this.client[prop](...args);
      if (result && typeof result.then === 'function') {
        return result;
      }
      return Promise.resolve(result); // Wrap synchronous calls
    } catch (error) {
      console.error(`❌ Error calling ${prop}:`);
      return Promise.reject(error);
    }
  }
}

module.exports = MockIORedis;
