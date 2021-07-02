'use strict'


var jsonToRet = {};
let links = [], nodes = [];
let root;

function flatten(root) {
    function recurse(node){
        if (node.branchset){
            node.branchset.forEach(function(n){
                var link = {}
                link.source = node.name
                link.target = n.name 
                if(n.length)
                    link.value = n.length
                links.push(link)
                recurse(n)
            });
        }
        var nd = {};
        nd.key = node.name;
        nodes.push(nd);
    }
    
    recurse(root);
}

function parse(json,datasetname,tableElements){
    root = json;
    links = [];
    nodes = [];
    root.forEach(flatten);

    jsonToRet = {};
    jsonToRet.nodes = nodes;
    jsonToRet.links = links; 
    jsonToRet.dataset_name = [];
    jsonToRet.data_type = [];
    jsonToRet.scheme_genes = [];
    jsonToRet.metadata = [];

    if(datasetname)  
        jsonToRet.dataset_name.push(datasetname)
    else
        jsonToRet.dataset_name.push('UNKNOWN_DATASET')

    if(tableElements){
        if(tableElements[0]){
            var profiles = tableElements[0]
            var headers = profiles[0].split('\t');
            jsonToRet.data_type.push(headers[0])
            jsonToRet.scheme_genes = headers;
        }else{
            jsonToRet.scheme_genes.push('UNKNOWN_SCHEME_GENES');
        }

        if(tableElements[1]){
            var isolates = tableElements[1]
            var elements = isolates[0].split('\t');
            jsonToRet.metadata = elements;
        } else {
            jsonToRet.metadata.push('UNKNOWN_METADATA');
        }
    } else {
        jsonToRet.data_type.push('UNKNOWN_DATA_TYPE');
        jsonToRet.scheme_genes.push('UNKNOWN_SCHEME_GENES');
        jsonToRet.metadata.push('UNKNOWN_METADATA');
    }
    
    return jsonToRet;
    
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