'use strict'


/*Load trees from databas*/

function getJson(data){
    return new Promise((resolve, reject) => {
        try{
            data = data.replace(/ /g,'---');
            data = JSON.parse(data)
            resolve(data)
        } catch(x){
            reject('Error parsing database file: ' + x.message);
        }
    });   
}

module.exports = {getJson}