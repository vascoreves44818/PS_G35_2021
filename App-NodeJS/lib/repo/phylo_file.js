 'use strict'

const fs = require('fs')
const newick = require("newick");
var parser = require("biojs-io-newick");

let filePath = './data/tree.txt'

function init(path) {
    if(path) filePath = path
    return {
        readNewickTree,
        readNexusTree,
        readInputText,
        readFile
    }
}

fs.readFileAsync = function(filename) {
    return new Promise(function(resolve, reject) {
        fs.readFile(filename, function(err, data){
            if (err) 
                reject(err); 
            else 
                resolve(data);
        });
    });
};


function readFile(fp){
    return fs
        .readFileAsync(fp)
        .then(text =>text)
        
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
    //lvls.pop()
    lvls.map(t => {
        if(!t.includes('(')){
            t = '(' + t + ')'
        }
        let js = newick.NewickTools.parse(t);
        arr.push(js)
    })
    return arr;

}

function readInputText(tree){
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
/*
function readInputText(tree){
    let arr = [];
    let lvls = tree.split(';');
    lvls.map(t => {
        if(!t.includes('(')){
            t = '(' + t + ')'
        }
        const result = parser.parse_nhx(t);
        arr.push(result)
    })
    return arr;
}
*/

module.exports = { init }