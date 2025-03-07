const redison = require('./redison');
const cachebox = require('./cachebox');
const rqueue = require('./rqueue');
const config = require('@bootloader/config');

module.exports = {
    client : redison, redis : redison,
    cachebox : cachebox, CacheBox : cachebox,
    rqueue : rqueue, RQueue : rqueue,rQueue : rqueue,
    waitForReady : async function(){
        if(redison.waitForReady){
            return await redison.waitForReady();
        }
        return redison;
    }
}
