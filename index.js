const redison = require('./redison');
const cachebox = require('./cachebox');
const config = require('@bootloader/config');

module.exports = {
    client : redison, redis : redison,
    cachebox : cachebox,
    waitForReady : async function(){
        if(redison.waitForReady){
            return await redison.waitForReady();
        }
        return redison;
    }
}
