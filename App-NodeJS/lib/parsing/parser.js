'use strict'

var index = 1;
var jsonToRet = {};
let links = [], nodes = [];
let root;
const unknown = 'UNKNOWN_'

function flatten(root) {
    function recurse(node){
        var nd = {};
        if(node.name.length == 0 || node.name === '' || node.name === ' ' || node.name === '_' || node.name === undefined || node.name === null){ 
            node.name = unknown+index;
            index++;
        }
        if (node.branchset){
            nd.isNodeLeaf = false;
            node.branchset.forEach(function(n){
                recurse(n)
                var link = {}
                link.source = node.name
                link.target = n.name 
                if(n.length)
                    link.value = n.length
                links.push(link)
            });
        }
        else nd.isNodeLeaf = true;
        
        nd.key = node.name;
        nodes.push(nd);
    }
    
    recurse(root);
}

function parse(json,datasetname,tableElements){
    root = json;
    links = [];
    nodes = [];
    index=1;
    root.forEach(flatten);

    jsonToRet = {};
    jsonToRet.nodes = nodes;
    jsonToRet.links = links; 
    jsonToRet.dataset_name = [];
    jsonToRet.data_type = [];
    jsonToRet.schemeGenes = [];
    jsonToRet.metadata = [];
    jsonToRet.subsetProfiles = [];
    jsonToRet.isolatesData = [];


    try{
        if(datasetname)  
        jsonToRet.dataset_name.push(datasetname)
    else
        jsonToRet.dataset_name.push('UNKNOWN_DATASET')

    if(tableElements && tableElements.length>0){
        var profiles = tableElements[0];
        var isolates = tableElements[1];

        if(profiles && profiles!='auxiliaryInfo='){
            var profileHeaders = profiles.shift();
            profileHeaders = profileHeaders.split('\t')
            //data_type
            jsonToRet.data_type.push(profileHeaders[0])
            //scheme_genes
            jsonToRet.schemeGenes = profileHeaders;
            
            //subsetprofile
            jsonToRet.subsetProfiles = [];
            for(let i= 0; i< profiles.length;++i){
                var toRet = {};
                toRet.profile = profiles[i].split('\t');
                jsonToRet.subsetProfiles.push(toRet);
            }

            //profiles
            for(let i= 0; i< profiles.length;++i){
                var values = profiles[i].split('\t');
                var n = nodes.find(x => x.key == values[0])
                if(n) n.profile = values;  
            }
        }
        if(isolates){
            //metadata
            var headers = isolates.shift();
            headers = headers.split('\t');
            jsonToRet.metadata = headers;

            //isolateData
            for(let i= 0; i< isolates.length;++i){
                var toRet = {};
                toRet.isolate = isolates[i].split('\t');
                jsonToRet.isolatesData.push(toRet);
            }

            //isolates
            for(let i= 0; i< isolates.length;++i){
                var values = isolates[i].split('\t');
                var n = nodes.find(x => x.key == values[0])
                if(n) n.isolates = values;  
            }

        } 
    } else {
        jsonToRet.data_type.push('UNKNOWN_DATA_TYPE');
        jsonToRet.schemeGenes.push('UNKNOWN_SCHEME_GENES');
        jsonToRet.metadata.push('UNKNOWN_METADATA');
    }
    
    return jsonToRet;
    } catch(x){
        console.log(x)
        jsonToRet = {};
        jsonToRet.nodes = nodes;
        jsonToRet.links = links;
        return toRet;
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
    data = data.replaceAll(' ','-')
    return data.split('\n')

}

module.exports = { parse, parseTables }