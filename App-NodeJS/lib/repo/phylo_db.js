'use strict'

/*Load trees from databas*/

function getJson(data){
    return new Promise((resolve, reject) => {
        try{
            data = JSON.parse(data)
            var links =[];
            var toRet = data.links;
            toRet.forEach(element => {
                var x = {}
                x.source = element.source.key;
                x.target = element.target.key;
                x.value = element.value;
                links.push(x);
            });
            data.links = links;
            resolve(data)
        } catch(x){
            reject('Error parsing database file!');
        }
    });   
}

module.exports = {getJson}