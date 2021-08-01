'use strict'

/*Load trees from databas*/

function getJson(data){
    return new Promise((resolve, reject) => {
        try{
            data = data.replaceAll(' ','---')
            data = JSON.parse(data)
            var links =[];
            var toRet = data.links;
            toRet.forEach(element => {
                var x = {}
                x.source = element.source.key;
                x.target = element.target.key;
                x.value = element.value;
                x.distance = element.distance;
                links.push(x);
            });
            data.links = links;

            /*var transform = data.graphPosition
            if(transform){
                transform = transform.replaceAll(' ','---')
            }

            data.graphPosition = transform;*/
            resolve(data)
        } catch(x){
            reject('Error parsing database file!');
        }
    });   
}

module.exports = {getJson}