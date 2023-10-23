const redison = require('./redison');

const DELIMTER = "#";
const NO_VALUE = ".";
const cachebox = function({domain,name,type,context,ttl}){
  let superKey = [	domain || NO_VALUE, 
  					name || NO_VALUE, 
  					type || NO_VALUE,
  					context || NO_VALUE].join(DELIMTER)
    return {
        async set(key,value, config){
            let thisKey = superKey + key || '';
            return await redison.set(thisKey,JSON.stringify({
                key : key,
                value : value,
                ttl : ttl
            }),{
                'EX' : config?.ttl || ttl,
            });
        },
        async get(key){
            let thisKey = superKey + key || '';
            let valJson = await redison.get(thisKey); 
            if(valJson){
                return JSON.parse(valJson).value;
            } 
            return null;
        },
        context(prefix,config){
            return cachebox({
                domain,name,type,
                context : (context || NO_VALUE) + DELIMTER + prefix, ttl,
                ...config
            });
        }
    }
};

module.exports = cachebox;