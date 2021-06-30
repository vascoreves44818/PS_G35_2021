'use strict'

const phylo_db = require('./../repo/phylo_db')
const phylo_file = require('./../repo/phylo_file')

let links = [], nodes = [];
let root;

function flatten(root) {
    function recurse(node){
        if (node.branchset){
            node.branchset.forEach(function(n){
                links.push({source: node.name, target: n.name})
                recurse(n)
            });
        }
        nodes.push(node);
    }
    recurse(root);
}

function parse(json){
    links = [];
    nodes = [];
    root = json
    root.forEach(flatten);

    return {
        nodes: nodes,
        links: links
    }
    
}

function parseTables(data){
    return data.includes('\r\n') ? splitByline(data) : splitByTab(data);

}

function splitByline(data){
    data = data.replaceAll('\t\t', '\t-\t')
    data = data.replaceAll('\t\r\n','\t-\r\n')
    data = data.replaceAll(' ','-')
    var toRet =  data.split('\r\n');
    return toRet;
}

function splitByTab(data){

}

module.exports = { parse, parseTables }