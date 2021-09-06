'use strict'

const newick = require("newick");
const parser = require('./../parsing/parser')


function getJson(tree, datasetname, tableElements){
    return new Promise((resolve, reject) => {
        var data;
        if(!tree) reject('No data inserted!')
        if(tree.includes('BEGIN'))
            data = readNexusTree(tree)
        else
            data = readNewickTree(tree)

        const renderDocs = parser.parse(data,datasetname,tableElements)
        resolve(renderDocs)

    });   
}

/* Returns array with trees in JSON*/
function readNewickTree(tree){
    let arr = [];
    
    let lvls = tree.split(';').filter(i => i);        
    lvls.map(t => {
        if(!t.includes('(')){
            t = '(' + t + ')'
        }
        let js = newick.NewickTools.parse(t);
        arr.push(js)
    })
    return arr;
        
}

/* Returns array with trees in JSON*/
function readNexusTree(tree){
    let arr = [];
    let nw = tree.split('=').pop();
    let lvls = nw.split(';').filter(i => i);
    lvls.pop()
    lvls.map(t => {
        if(!t.includes('(')){
            t = '(' + t + ')'
        }
        let js = newick.NewickTools.parse(t);
        arr.push(js)
    })
    return arr;
}

function createTables(profile,auxiliary){
    return new Promise((resolve,reject) => {
        let array = [];
        let pd,ad;
       try{
            if(profile){
                pd = parser.parseTables(profile);
                array.push(pd)
            }
                
            if(auxiliary){
                ad = parser.parseTables(auxiliary)
                array.push(ad)
            }
            resolve(array);  
       } catch(x){
           reject(x)
       }
        
    })
    
}





module.exports = { getJson,createTables }