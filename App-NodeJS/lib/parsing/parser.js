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

module.exports = { parse }