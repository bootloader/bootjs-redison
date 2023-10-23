const CacheBox = require('./cachebox');

module.exports = {
    async get({ domain,type,key}){
        let cb = new CacheBox({
            domain, name : "ping",type,
            ttl : 50
        });
        try {
            let config = await cb.get(key);
            if(config){
                console.log("FOUND",key)
                return config;
            }
        } catch(e){
            console.log("GET ERROR",e)
        } 
        console.log("NOT_FOUND",key)
        let doc = { data : "PING", stamp : Date.now() };
        await cb.set(key,doc);
        return doc;
    }
};