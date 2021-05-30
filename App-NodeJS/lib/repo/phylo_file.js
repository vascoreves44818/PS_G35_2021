 'use strict'

const fs = require('fs')
const newick = require("newick");

let filePath = './data/tree.txt'

function init(path) {
    if(path) filePath = path
    return {
        readNewickTree,
        readNexusTree,
        readInputText
    }
}


function readFile(fp){
    return fs
        .readFile(fp)
        .then(text =>text)
}

/* Returns array with trees in JSON*/
function readNewickTree(){
    let arr = [];
    return readFile(filePath)
        .then(tree => {
            let lvls = tree.split(';').filter(i => i);
            lvls.map(t => {
                if(!t.includes('(')){
                    t = '(' + t + ')'
                }
                let js = newick.NewickTools.parse(t);
                arr.push(js)
            })
            return arr;
        })
}

/* Returns array with trees in JSON*/
function readNexusTree(){
    let arr = [];
    return readFile(filePath)
        .then(tree => {
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
        })
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


module.exports = { init }