const redison = require("./redison");
const info = require("./info");

class RediX {
  constructor() {
    // Auto-bind all Redis methods using Proxy
    return new Proxy(this, {
      get: (target, prop) => {
        if (typeof target[prop] !== "undefined") return target[prop];
        return (...args) => target._executeCommand(prop, args);
      },
    });
  }

  async _executeCommand(command, args) {
    if (command === "set") return this._handleSetCommand(args);
    // Ensure that the redison client has the requested command
    if (typeof redison[command] === "function") {
      return await redison[command](...args);
    }
    throw new Error(`Command ${command} not supported`);
  }

  async _handleSetCommand(args) {
    const [key, value, ...options] = args;

    // Detect argument style and convert if needed
    const convertedOptions = this._convertArgs(options);

    if (this.isIoredis) {
      return await redison.set(key, value, ...convertedOptions);
    } else {
      return await redison.set(key, value, convertedOptions);
    }
  }

  _convertArgs(args) {
    if (args.length && typeof args[0] === "object") {
      // Convert object-style { EX: 60, NX: true } → ["EX", 60, "NX"]
      const converted = [];
      for (let [key, value] of Object.entries(args[0])) {
        converted.push(key);
        if (value !== true) converted.push(value);
      }
      return converted;
    } else {
      // Convert array-style ["EX", 60, "NX"] → { EX: 60, NX: true }
      let _args = Array.isArray(args[0]) ? args[0] : args;
      return _args.reduce((acc, curr, index) => {
        if (index % 2 === 0)
          acc[curr] = _args[index + 1] !== undefined ? _args[index + 1] : true;
        return acc;
      }, {});
    }
  }
}
const redix = new RediX();

// ✅ Works with both require() and import:
module.exports = redix; // CommonJS