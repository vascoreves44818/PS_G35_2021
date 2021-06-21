'use strict'

const newick = require("newick");
const parser = require('./../parsing/parser')


function getJson(tree){
    return new Promise((resolve, reject) => {
        var data;
        if(!tree) reject('No data inserted!')
        if(tree.includes('BEGIN'))
            data = readNexusTree(tree)
        else
            data = readNewickTree(tree)

        const renderDocs = parser.parse(data)
        resolve(renderDocs)

    });
    
    
}

function createTables(profile,auxiliary){
    let array = [];
    let pd,ad;
    if(profile){
        pd = profile.split('\r\n') 
        array.push(pd)
    }
     
    if(auxiliary){
        ad = auxiliary.split('\r\n') 
        array.push(ad)
    }
    return array;
}

function readProfile(profileData){    
    return new Promise((resolve, reject) => {
        let tableElements = profileData.split('\r\n')        
        resolve(tableElements)
    });
}

function readAuxiliar(auxData){    
    return new Promise((resolve, reject) => {
        let tableElements = auxData.split('\r\n')
        resolve(tableElements)
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


module.exports = { getJson,createTables }