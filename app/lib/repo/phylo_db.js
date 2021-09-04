'use strict'

/*Load trees from databas*/

function getJson(data){
    return new Promise((resolve, reject) => {
        try{
            data = data.replaceAll(' ','---')
            data = JSON.parse(data)
            resolve(data)
        } catch(x){
            reject('Error parsing database file!');
        }
    });   
}

module.exports = {getJson}