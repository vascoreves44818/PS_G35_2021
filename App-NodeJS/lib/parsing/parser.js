'use strict'

const phylo_db = require('./phylo_db')
const phylo_file = require('./phylo_db')

var tree = script.getAttribute('tree');
root.forEach(flatten);

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