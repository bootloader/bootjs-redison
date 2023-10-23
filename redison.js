
const config = require('config');

const client = (function(host){
    if(host == '<host>'){
        const redisMock = require('redis-mock');
        return redisMock.createClient();
    } else {
        let redis =  require("redis");
        return redis.createClient({
            url: `redis://${host}:${config.get('mry.redis.port')}`
        });
    }
})(config.get('mry.redis.host'))

client.on('error', (err) => console.log('Redis Client Error', err));
client.on('connect', () => console.log('Redis Client connected'));
(typeof client.connect == 'function') && client.connect();


client.set("conneted_on",new Date().toISOString());

module.exports = client;