const IORedis = require("ioredis");

class MockIORedis {
  constructor() {
    this.client = null;
    this.connected = false;
    this.queue = [];
    this.url = null;

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === "connect") {
          return (url) => this.connect(url);
        }
        if (prop === "disconnect") {
          return () => this.disconnect();
        }
        if (prop === "waitForReady") {
          return () => this.waitForReady();
        }
        return (...args) => this._callMethod(prop, args);
      },
    });
  }

  async connect({
    host = "127.0.0.1",
    port = 6379,
    maxRetriesPerRequest = null,
  }) {
    if (this.connected) {
      console.warn("⚠️ Redis is already connected.");
      return;
    }
    const redisURI = `redis://${host}:${port}`;

    if (!redisURI) {
      console.error("❌ Redis URL is required to connect!");
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

    this.client.on("error", (err) => console.error("Redis Error:", err));
    this.client.on("connect", () => {
      console.log("✅ Redis Client connected");
      this._flushQueue();
    });
  }

  async disconnect() {
    if (this.client) {
      console.log("🔴 Disconnecting from Redis...");
      await this.client.quit(); // `quit()` is better than `disconnect()` for cleanup
      this.client = null;
      this.connected = false;
    }
  }

  async waitForReady() {
    if (this.connected) return;

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (this.connected) {
          clearInterval(checkInterval);
          resolve(this.client);
        }
      }, 100); // Check every 100ms
    });
  }

  _flushQueue() {
    if (!this.client) return;
    this.queue.forEach(({ prop, args, resolve, reject }) => {
      try {
        const result = this.client[prop](...args);
        if (result && typeof result.then === "function") {
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
      if (result && typeof result.then === "function") {
        return result;
      }
      return Promise.resolve(result); // Wrap synchronous calls
    } catch (error) {
      return Promise.reject(error);
    }
  }
}

module.exports = MockIORedis;
