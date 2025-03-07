const redison = require('./redison');

const DELIMTER = "#";
const NO_VALUE = ".";
const rqueue = function({domain,name,type,context,ttl}){
  let superKey = [	domain || NO_VALUE, 
  					name || NO_VALUE, 
  					type || NO_VALUE,
  					context || NO_VALUE].join(DELIMTER)
    return {
        async push(value){
            let thisKey = superKey;// + key || '';
            return await redison.rpush(thisKey,JSON.stringify({
                value : value,
                ttl : ttl
            }));
        },
        async pop(){
            let thisKey = superKey;// + key || '';
            let valJson = await redison.lpop(thisKey); 
            if(valJson && typeof valJson =='string'){
                return JSON.parse(valJson).value;
            } else if(valJson) {
                console.log("valJson",valJson)
            }
            return null;
        },
        context(prefix,config){
            return rqueue({
                domain,name,type,
                context : (context || NO_VALUE) + DELIMTER + prefix, ttl,
                ...config
            });
        }
    }
};

module.exports = rqueue;