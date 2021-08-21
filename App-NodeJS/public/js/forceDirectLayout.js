window.onload = setup 

const home_tab = document.getElementById('home-tab')
const switchNodeLabels = document.getElementById('NodeLabelsSwitch')
const rangeNodeLabelSize = document.getElementById('NodeLabelsRange')

const switchLinkLabels = document.getElementById('LinkLabelsSwitch')
const rangeLinkLabelSize = document.getElementById('LinkLabelsRange')

const chargeForceRange = document.getElementById('chargeForceRange')
const colideForceRange = document.getElementById('colideForceRange')

const profileColorFilter = document.getElementById('profileColorFilter');
const isolateColorFilter = document.getElementById('isolateColorFilter');

const NodeSizeRange = document.getElementById('NodeSizeRange');
const nodeLogScale = document.getElementById('nodeLogScale');
const nodeSizeKey = document.getElementById('nodeSizeKey');

const linkStrokeRange = document.getElementById('linkStrokeRange');
const linkSizeRange = document.getElementById('linkSizeRange');
const linkLogScale = document.getElementById('linkLogScale');

const pauseButton = document.getElementById('pauseButton');
const graphicInfo = document.getElementById('GraphicInfo');

const searchGraph = document.getElementById('searchGraph');

const linkToTreeBtn = document.getElementById('linkToTreeBtn');

const height = window.innerHeight*6;
const width = window.innerWidth*6;
const defaultcollideForce = 1;
const defaultStrength = -300;

const svgCanvas ='#svgCanvas';
const nodelabels = 'nodelabels';
const linklabels ='linklabels';
const colorExpand = "#c6dbef";
const colorLeafNodes = "#fd8d3c"
const colorCollapse = "#000000";

//const colorCollapse = "#3182bd";
const defaultNodeSize = 25;
const defaultLinkSize = 20;
const defaultNodeScaleFactor = 20;
const defaultLinkScaleFactor = 4;
const defaultLinkStroke = 5; 

function setup(){
    var script = document.getElementById('forceDirectedLayout');
    var json = script.getAttribute('json');
    
    try{
        json = json.replaceAll('---',' ')
        jsonData = JSON.parse(json);

        links = jsonData.links
        nodes = jsonData.nodes
        metadata = jsonData.metadata
        schemeGenes = jsonData.schemeGenes
        subsetProfiles =  jsonData.subsetProfiles;
        isolateData = jsonData.isolatesData;
    } catch(x){
        alert(x.message);
        //alert('Problem reading information. Insert again.');
        return;
    }
   
   
    init(); 
    setValues();
    setVisibleControls();
    setGraphicFilters();
    setGraphicInfo();
    createTables();
    setEventListenners();

}

function setVisibleControls(){
    var navTab = document.getElementById('graphicTab')
    navTab.style.visibility = 'visible';
    var graphicControls = document.getElementById('graphicControls')
    graphicControls.style.visibility = 'visible'
}

function setGraphicFilters(){
    if(schemeGenes){
        var colorOption = document.createElement('option')
        colorOption.value = 'profile'
        colorOption.innerHTML = 'Profile'
        nodeSizeKey.append(colorOption)
        
        schemeGenes.forEach( x => {
            var opt = document.createElement('option');
            opt.value = x;
            opt.innerHTML = x;
            profileColorFilter
                .append(opt);
        })
    }
        
    if(metadata){
        var colorOption = document.createElement('option')
        colorOption.value = 'isolates'
        colorOption.innerHTML = 'Isolate'
        nodeSizeKey.append(colorOption)

        metadata.forEach( x => {
            var opt = document.createElement('option');
            opt.value = x;
            opt.innerHTML = x;
            isolateColorFilter
                .append(opt);
        })
    }
    
}

function setEventListenners(){
    switchNodeLabels.addEventListener('change', function () {
        checker(this.checked)
    })
    rangeNodeLabelSize.addEventListener('input', changeNodeLabelSize)

    switchLinkLabels.addEventListener('change', function () {
        checkerLinks(this.checked)
    })
    rangeLinkLabelSize.addEventListener('input', changeLinkLabelSize)

    chargeForceRange.addEventListener('input', changeChargeForce)
    colideForceRange.addEventListener('input', changeColideForce)

    profileColorFilter.addEventListener('input', changeColorByProfile)
    isolateColorFilter.addEventListener('input', changeColorByIsolate)

    NodeSizeRange.addEventListener('input',changeNodeSize)
    nodeLogScale.addEventListener('change', changeNodeSize)
    nodeSizeKey.addEventListener('input',changeNodeSize)

    linkStrokeRange.addEventListener('input',changeLinkStroke)
    linkLogScale.addEventListener("change",changeLinkSize)
    linkSizeRange.addEventListener("input",changeLinkSize)

    linkToTreeBtn.addEventListener("click",linkToTree)

    
}

function setGraphicInfo(){
    graphicInfo
    .innerHTML = 
        `<div style="color: black;" class="graphicInfoText">
            <b>Data set name: </b><p>${jsonData.dataset_name}</p>
            <b>Data Type: </b><p>${jsonData.data_type}</p> 
            <b>Node count: </b><p>${jsonData.nodes.length}</p>
            <b>Scheme Genes: </b><p>${jsonData.schemeGenes}</p> 
            <b>Metadata: </b><p>${jsonData.metadata}</p>  
        </div>`
}

function setValues(){
    NodeSizeRange.value = jsonData.nodeScaleFactor ? jsonData.nodeScaleFactor : defaultNodeScaleFactor;
    linkSizeRange.value = jsonData.linkScaleFactor ? jsonData.linkScaleFactor : defaultLinkScaleFactor;
    nodeSizeKey.value = jsonData.sizeKey ? jsonData.sizeKey : '';
    linkStrokeRange.value = jsonData.linkStroke ? jsonData.linkStroke : defaultLinkStroke;   
    chargeForceRange.value = defaultStrength
    colideForceRange.value = defaultcollideForce


}

/////////////////// FORCE DIRECT LAYOUT ///////////////////////////
const colorSequence = d3.interpolateSinebow;
const zoom = d3.zoom();
let linkForce;
let jsonData = {};
let links = [], nodes = [];
let metadata = [], schemeGenes = [];
let subsetProfiles = [], isolateData =[];
let paused = false;
let pinned = false;
let simulation;
let svg;
let link, node;
let linkText;
let g;

function init(){
    svg = d3.select(svgCanvas)
        .attr("viewBox", [0,0, width, height]);
        
    link = svg.selectAll(".link")
    node = svg.selectAll(".node");
    g = svg.append("g").attr("id", 'gSvg');

    zoom
        .on("zoom", function({transform}){
            g.attr("transform", transform);
            jsonData.transform = transform;
        });

    svg.call(zoom);
    
    start()
}

function start(){

    link = g.append("g")
        .attr("class", "link")
        .selectAll('g')
        .data(links)
        .enter()
        .append("g")
        .attr("class", "links")
        .attr("id",d => (d.source+'-'+d.target))
        .append("line")
        .attr("class", "line")

    linkText = g.selectAll(".links")
        .append("text")
        .attr("class", linklabels)
        .text(d=> d.value ? d.value : 'unknown');

    node = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .join("g")

    node
        .attr("id", d => d.key+"_node")
        .append("circle")
        .attr("id", d => d.key)
        .attr("r", nodeSize)
        .on('click', click)
        

    node.append("text")
        .attr("class",nodelabels)
        .text(d => d.key)
    
    
 
    node.selectAll("circle")
        .style("fill", color);

    node.call(d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );

    if(jsonData.isSaved){
        startDBfilters();
        startSimulation();
        nodes.map(x=>{
            if(x.isCollapsed){
                var changeColor = document.getElementById(x.key)
                changeColor.style.fill = x.previousColor
                x.previousColor = null;
                x.isCollapsed = false;
                click(null,x)
            }
            
        })
        setTimeout(pauseSimulation, 500)
        
    }
    else{ 
        startSimulation();
    }
    checker(switchNodeLabels.checked)
    checkerLinks(switchLinkLabels.checked)
}

function startDBfilters(){
    if(jsonData.nodeLabels){
        rangeNodeLabelSize.value = jsonData.nodeLabelsSize;
        changeNodeLabelSize()
        switchNodeLabels.checked = jsonData.nodeLabels;
    }
    if(jsonData.linkLabels){
        rangeLinkLabelSize.value = jsonData.linkLabelsSize;
        changeLinkLabelSize()
        switchLinkLabels.checked = jsonData.linkLabels;
    }

    changeLinkStroke(); 
    
    if(jsonData.colorKey){
        if(jsonData.colorKey.profile){
            changeColorByProfile(null,jsonData.colorKey.profile)
            profileColorFilter.value = jsonData.colorKey.profile;
        } else { 
            changeColorByIsolate(null,jsonData.colorKey.isolate)
            isolateColorFilter.value = jsonData.colorKey.isolate
        }
    } 

    
    if(jsonData.transform){
        var transform = jsonData.transform;
        
        g.attr("transform", "translate(" + transform.x + "," + transform.y + ") scale(" + transform.k + ")");
        //zoom.translateBy(g,transform.x,transform.y)
        //zoom.scaleBy(g,transform.k)
    }
    

}

function startSimulation(){
    
    linkForce = d3.forceLink(links);
    linkForce.id(d => d.key)
        .distance(d => d.distance ? d.distance : linkSize(d))
    
    jsonData.collideForce = jsonData.collideForce ? jsonData.collideForce : (defaultNodeSize + (jsonData.nodeScaleFactor ? jsonData.nodeScaleFactor : defaultNodeScaleFactor))
    jsonData.strength = jsonData.strength ? jsonData.strength : defaultStrength;
    
    simulation = d3.forceSimulation(nodes)
        .force("link", linkForce)
        .force("charge", d3.forceManyBody().strength(jsonData.strength))
        .force("center", d3.forceCenter(width /2 , height/2))
        .force("collide", d3.forceCollide().radius(jsonData.collideForce))
        .alphaDecay(0)
        .on("tick", ticked);
    
}

///// GRAPHIC LABELS //////
function checker(checked) {
    jsonData.nodeLabels = checked;
    checked ? showLabels(nodelabels) : hideLabels(nodelabels)
}

function checkerLinks(checked) {
    jsonData.linkLabels = checked;
    checked ? showLabels(linklabels) : hideLabels(linklabels)
}

function showLabels(className) {
    var labels = document.getElementsByClassName(className)
    for (i = 0; i < labels.length; i++) {
        if(!labels[i].isCollapsed && !(labels[i].innerHTML.includes('UNKNOWN')))
            labels[i].style.visibility = "visible";
    }
}

function hideLabels(className) {
    var labels = document.getElementsByClassName(className)
    for (i = 0; i < labels.length; i++) {
        if(!labels[i].isCollapsed)
            labels[i].style.visibility = "hidden";
    }
}

function changeNodeLabelSize(){
    jsonData.nodeLabelsSize = rangeNodeLabelSize.value
    node.selectAll("text")
        .style("font-size",jsonData.nodeLabelsSize)
}

function changeLinkLabelSize(){
    jsonData.linkLabelsSize = rangeLinkLabelSize.value
    linkText
        .style("font-size",jsonData.linkLabelsSize)
}

/////// NODE AND LINK COLOR & SIZE ////////
function changeNodeSize(){
    jsonData.nodeScaleFactor = NodeSizeRange.value
    jsonData.sizeKey = nodeSizeKey.value;

    node.selectAll("circle")
        .attr("r", nodeSize);
}

function changeLinkStroke(){
    jsonData.linkStroke = linkStrokeRange.value
    link
        .style("stroke-width",jsonData.linkStroke)
}

function changeLinkSize(){
    jsonData.linkScaleFactor = linkSizeRange.value
    linkForce.distance(linkSize)
    simulation.force("link", linkForce)

}

function nodeSize(d){
    var expr1 = defaultNodeSize;
    var sclFctr = (jsonData.nodeScaleFactor ? jsonData.nodeScaleFactor : defaultNodeScaleFactor);
    var expr2 = ((jsonData.sizeKey && d[jsonData.sizeKey]) ? d[jsonData.sizeKey].length : 1) * sclFctr; 

    if(nodeLogScale.checked){
        d.backupSize = d.backupSize ? d.backupSize : expr1 + expr2;
        expr1 = defaultNodeSize * Math.log10(d.backupSize)
    }
    d.backupSize = expr1 + expr2
    d.size = d.backupSize;
           
    return d.size;   
}

function linkSize(l){
    var expr1 = defaultLinkSize;
    var sclFctr =(jsonData.linkScaleFactor ? jsonData.linkScaleFactor : defaultLinkScaleFactor)*nodeSize(l.target) ;
    var expr2 = (l.value ? l.value : 1) + sclFctr; 
    
    if(linkLogScale.checked){
        l.distance = l.distance ? l.distance : expr1 + expr2;
        expr1 = defaultLinkSize * Math.log10(l.distance);
    }
    l.distance = expr1 + expr2
    return l.distance;
}


function color(node,value){
    if(node.isCollapsed)
        return colorCollapse;
    if(value){
        var x = value(node);
        if(x) return x;
    } 
    return node.isNodeLeaf ? colorLeafNodes : colorExpand;
}

function changeColorByProfile(e,k){
    var colorScheme = {}
    var key = k ? k : profileColorFilter.value;
    jsonData.colorKey = {profile : key}

    if(!key || key.includes('UNKNOWN')){
        node.selectAll("circle")
            .style("fill",color);
            return;
    }

    removeNodePieCharts()

    var index = schemeGenes.indexOf(key);

    subsetProfiles.forEach(x =>{
        if(x.profile[index]){
            var data = x.profile[index];
            colorScheme[data] = colorScheme[data] ? colorScheme[data]+1 : 1;
        }
    })

    var keys = Object.keys(colorScheme);
    
    let myScale = d3.scaleSequential(d3.interpolateRainbow)
        .domain([0,keys.length])

    var value = function(d){ 
        try{
            if(d.profile[index]){  
                var clr = myScale(keys.indexOf(d.profile[index]))
                return clr;  
            }
            return null;
        }catch(x){
            console.log(x)
        }
    } 

    node.selectAll("circle")
        .style("fill",x => color(x,value));
    
}

function changeColorByIsolate(e,k){
    var colorScheme = {}
    var key = k ? k : isolateColorFilter.value;
    jsonData.colorKey = {isolate : key}
    if(!key || key.includes('UNKNOWN')){
        node.selectAll("circle")
            .style("fill",d => color(d));
        return;
    }
    removeNodePieCharts();
    var index = metadata.indexOf(key);

    isolateData.forEach(x =>{
        if(x.isolate[index]){
            var data = x.isolate[index];
            colorScheme[data] = colorScheme[data] ? colorScheme[data]+1 : 1;
        }
    })
    
    var keys = Object.keys(colorScheme);

    let myScale = d3.scaleSequential(d3.interpolateRainbow)
        .domain([0,keys.length])

    var value = function(d){ 
        try{ 
            if(d.isolates){
                var clr = myScale(keys.indexOf(d.isolates[index]))
                //console.log(clr +'-' + d.isolates[index])
                return clr;
            } 
            return null;
        }catch(x){
            console.log(x);
        }
    }

    node.selectAll("circle")
        .style("fill",x => color(x,value));

}


///// GRAPHIC FORCES ////////
function changeChargeForce(){
    jsonData.strength = chargeForceRange.value

    simulation.force("charge", d3.forceManyBody().strength(jsonData.strength))
}

function changeColideForce(){
    var chck = (defaultNodeSize + (jsonData.nodeScaleFactor ? jsonData.nodeScaleFactor : defaultNodeScaleFactor))
    jsonData.collideForce = colideForceRange.value +chck;
    simulation
        .force("collide", d3.forceCollide().radius(jsonData.collideForce))

}

function resetForces(){
    
    chargeForceRange.value = defaultStrength ;
    colideForceRange.value = defaultcollideForce;
    changeChargeForce();
    changeColideForce();
}
 
/////// GRAPHIC MOVEMENT ////////

function click(event, node){
    console.log("NODE CLICKED")
    if(node.isNodeLeaf) return;
    var changeColor = document.getElementById(node.key)
    
    var isCollapsing = node.isCollapsed ? false : true;
    node.isCollapsed = isCollapsing;
    
    
    recurse(node.key)
    

    function recurse(key){
        links.forEach(n => {
            var source = n.source;
            var target = n.target;
            if(source.key == key){
           
                //GET NEXT NODE ELEMENT
                var nd = document.getElementById(target.key+"_node");
                var elements = nd.children
                
                //CHANGE VISIBILITY TO NODE AND TEXT
                for(let i = 0; i<elements.length ; ++i){
                    elements[i].isCollapsed = isCollapsing;
                    changeVisibility(elements[i])
                }

                //CAHNGE VISIBILITY TO LINK
                var lk = document.getElementById(source.key+'-'+target.key);
                var linkElements = lk.children

                for(let i = 0; i<linkElements.length ; ++i){
                    linkElements[i].isCollapsed = isCollapsing;
                    changeVisibility(linkElements[i])
                }

                //check if next node is already collapsed
                if(isCollapsing && !target.isCollapsed){
                    recurse(target.key)
                } else if (!isCollapsing && !target.isCollapsed){
                    recurse(target.key)
                }
            }
        })
    
    }

    function changeVisibility(element){
        var visibility = element.style.visibility
        var type = element.className.baseVal 

        if (visibility==null || visibility=='visible' || visibility =='' || visibility == undefined){ 
            element.style.visibility = "hidden"
        }else if((type==nodelabels && !switchNodeLabels.checked) || (type==linklabels && !switchLinkLabels.checked) || element.innerHTML.includes('UNKNOWN')){
            element.style.visibility="hidden"
        }
        else{ 
            element.style.visibility="visible"
        }
        
    }
 
    if(isCollapsing){ 
        node.previousColor = changeColor.style.fill;
        changeColor.style.fill = color(node)
    }else{
        changeColor.style.fill = node.previousColor
        node.previousColor = null;
    }
    
    
    
    
}

/*
function click(event, node){
    console.log("NODE CLICKED")
    if(node.isNodeLeaf) return;
    var changeColor = document.getElementById(node.key)
    
    var isCollapsing = node.isCollapsed ? false : true;
    node.isCollapsed = isCollapsing;
    
    
    recurse(node.key)
    

    function recurse(key){
        links.forEach(n => {
            var source = n.source;
            var target = n.target;
            if(source.key == key){
           
                //GET NEXT NODE ELEMENT
                var nd = document.getElementById(target.key+"_node");
                var elements = nd.children
                
                //CHANGE VISIBILITY TO NODE AND TEXT
                for(let i = 0; i<elements.length ; ++i){
                    elements[i].isCollapsed = isCollapsing;
                    changeVisibility(elements[i])
                }

                //CAHNGE VISIBILITY TO LINK
                var lk = document.getElementById(source.key+'-'+target.key);
                var linkElements = lk.children

                for(let i = 0; i<linkElements.length ; ++i){
                    linkElements[i].isCollapsed = isCollapsing;
                    changeVisibility(linkElements[i])
                }

                //check if next node is already collapsed
                if(isCollapsing && !target.isCollapsed){
                    recurse(target.key)
                } else if (!isCollapsing && !target.isCollapsed){
                    recurse(target.key)
                }
            }
        })
    
    }

    function changeVisibility(element){
        var visibility = element.getAttribute('visibility')
        var type = element.className.baseVal 

        if (visibility==null || visibility=='visible'){ 
            element.setAttribute("visibility","hidden")
            element.isVisible = 'hidden'
        }else if((type==nodelabels && !switchNodeLabels.checked) || (type==linklabels && !switchLinkLabels.checked)){
            element.setAttribute("visibility","hidden")
            element.isVisible = 'hidden'
        }
        else{ 
            element.setAttribute("visibility","visible")
            element.isVisible = 'visible'
        }
        
    }
 
    if(isCollapsing){ 
        node.previousColor = changeColor.style.fill;
        changeColor.style.fill = color(node)
    }else{
        changeColor.style.fill = node.previousColor
        node.previousColor = null;
    }
    
    
    
    
}
*/
function ticked() {
    try {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        linkText
            .attr("x", function(d) {
                return ((d.source.x + d.target.x)/2);
            })
            .attr("y", function(d) {
                return ((d.source.y + d.target.y)/2);
            });
        
        node
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            })
    } catch (error) {
        console.log(error)
    }
   
        
}

function dragstarted(d) {
    try{
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.subject.fx = d.x;
        d.subject.fy = d.y;
    }catch (error) {
        console.log(error)
    }
    

}

function dragged(d) {
    try{ 
        d.subject.fx = d.x;
        d.subject.fy = d.y;
    }catch (error) {
        console.log(error)
    }
}

function dragended(d) {
    try{
        if (!event.active) simulation.alphaTarget(0);
        d.subject.fx = null;
        d.subject.fy = null;
    }catch (error) {
        console.log(error)
    }
    
}

/////// GRAPHIC BUTTONS ///////////////
function restartSimulation(){
    /*simulation.stop();
    g.selectAll("*").remove();
    start();*/
}

function pauseSimulation(){
    if(paused){
        simulation = simulation.restart();
        node.call(d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );
        var btnContinue = document.getElementById('btn_continue_simulation');
        var btnPause = document.getElementById('btn_pause_simulation');
        btnContinue.style.visibility = 'hidden'
        btnPause.style.visibility = 'visible'
        paused = false;
    } else {
        simulation = simulation.stop();
        node.call(d3
            .drag()
            .on("start", null)
            .on("drag", null)
            .on("end", null)
        );
        var btnContinue = document.getElementById('btn_continue_simulation');
        var btnPause = document.getElementById('btn_pause_simulation');
        btnContinue.style.visibility = 'visible'
        btnPause.style.visibility = 'hidden'
        paused = true;
    }
    
}

function pinNodes(){
        
}

function save(){
    console.log('SAVING')
    try {
        jsonData.isSaved = true
        
        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData));
        var dlElem = document.getElementById('downloadElem');
        dlElem.setAttribute("href",dataStr);
        dlElem.setAttribute("download", jsonData.dataset_name + ".json");
        dlElem.click()
        console.log('SAVED WITH SUCESS')
    } catch(err){
        alert('Couldn\'t save file: \n' + err)
    }
}

function searchGraphByNode(){
    const nodeKey = searchGraph.value;
    
    let ndArray = nodes.filter(node=>{
        return node.key === nodeKey;
    })
    
    if(ndArray[0]){
        if(!paused)
            pauseSimulation();
        var nd = ndArray[0];
        var scale = 5;
        zoom.translateTo(g,nd.x,nd.y)
        zoom.scaleTo(g,scale)
        /*var translateX = width / 2 - scale * nd.x;
        var translateY =  height / 2 - scale * nd.y;
        g.attr("transform", "translate(" + translateX + "," + translateY + ") scale(" + scale + ")");*/
        

    }
    


}

///////////////////// TABLES ////////////////////////////////

var current_page_profile = 1;
var current_page_aux = 1;
var records_per_page = 10;
let obj;
let pData;
let auxData;
var table;
var tableProfile, tableIsolate;
var tableHeaderProfile, tableHeaderIsolate;
var tableBodyProfile, tableBodyIsolate;
var tableFootProfile, tableFootIsolate;
var isolateTableCondition, profileTabelCondition;
var condition = null;
var divTabelProfile, divTabelIsolate;
var page_span;
var btn_next, btn_prev;

var tab;

const profileTableID = 'profileTabel'
const isolateTableID = 'auxTable'
const search = 'search_';

function createTables(){
    try{
        if(subsetProfiles && subsetProfiles.length>0){  
            divTabelProfile = document.getElementById(profileTableID)
            tableProfile = document.createElement('table')
            tableHeaderProfile = document.createElement('thead')
            tableBodyProfile = document.createElement('tbody')
            tableFootProfile = document.createElement('tfoot');
            
            tableProfile.appendChild(tableHeaderProfile);
            tableProfile.appendChild(tableBodyProfile);
            tableProfile.appendChild(tableFootProfile);
            divTabelProfile.appendChild(tableProfile);

            tableProfile.setAttribute('class','table table-striped table-bordered table-hover')

            btn_next = document.getElementById("btn_next-profile");
            btn_prev = document.getElementById("btn_prev_profile");
            page_span = document.getElementById("pageProfile");
            obj = subsetProfiles;
            
            buildTableHeaders(schemeGenes,tableHeaderProfile)

            changePage(1,tableBodyProfile);

            buildTableFooter(schemeGenes,tableFootProfile)
        }
        if(isolateData && isolateData.length>0){
            divTabelIsolate = document.getElementById(isolateTableID)
            tableIsolate = document.createElement('table')
            tableHeaderIsolate = document.createElement('thead')
            tableBodyIsolate = document.createElement('tbody')
            tableFootIsolate = document.createElement('tfoot');
            
            tableIsolate.appendChild(tableHeaderIsolate);
            tableIsolate.appendChild(tableBodyIsolate);
            tableIsolate.appendChild(tableFootIsolate);
            divTabelIsolate.appendChild(tableIsolate)

            tableIsolate.setAttribute('class','table table-striped table-bordered table-hover')

            btn_next = document.getElementById("btn_next-aux");
            btn_prev = document.getElementById("btn_prev_aux");
            page_span = document.getElementById("pageAux");
            obj = isolateData;

            buildTableHeaders(metadata,tableHeaderIsolate);
               

            changePage(1,tableBodyIsolate);
            
            buildTableFooter(metadata,tableFootIsolate);
        }
    } catch(x){
        console.log(x);
    }
    
   
}

function buildTableHeaders(headers, tableHead){
    return new Promise((resolve, reject) => {
        var tableTRhead = document.createElement('tr');
        tableHead.appendChild(tableTRhead)
         
        try {
            headers.forEach(element => {
                var headerElement = document.createElement('th')

                tableTRhead.appendChild(headerElement);

                var linkHeader = document.createElement('a')
                    linkHeader.setAttribute('class', 'nounderline btn-lg')
                    linkHeader.setAttribute("data-toggle","collapse")
                    
                    
                    linkHeader.onclick = newPieChart;
                    linkHeader.innerHTML = element
            
                headerElement.appendChild(linkHeader);
                tableTRhead.appendChild(headerElement);    
            });
            
            resolve(tableHead);
        } catch (error) {
            console.log(error);
            reject(error);
        }
            
    })  
}

function buildTableBody(data, tableBody){
    return new Promise((resolve, reject) => {
        tableBody.innerHTML = ""
        try {
            data.forEach(row => {
                var tableTR = document.createElement('tr');
                tableBody.appendChild(tableTR);

                row.forEach(element => {
                    var tableElement = document.createElement('td')
                    tableElement.innerHTML=element;
                    tableElement.setAttribute('id',element);
                    tableTR.appendChild(tableElement);
                })    
            });
            resolve(tableBody)
            
        } catch (error) {
            console.log(error);
            reject(error);
        }
            
    })
    
}

function  buildTableFooter(headers, tableFooter){
    return new Promise((resolve, reject) => {
        var tableTR = document.createElement('tr');
        tableFooter.appendChild(tableTR)

        try {
            headers.forEach(element => {
                var footerElement = document.createElement('th')
                
                var searchHeader = document.createElement('input')
                searchHeader
                    .setAttribute('id',search+element)
                searchHeader
                    .setAttribute('class', 'searchTables form-control')
                searchHeader
                    .setAttribute('type', 'text')
                searchHeader
                    .setAttribute('placeholder', 'Search '+element)
                
                searchHeader.
                    addEventListener('input',filterTable)

                footerElement.appendChild(searchHeader);
                tableTR.appendChild(footerElement);
                resolve(tableFooter);
            });
        } catch (error) {
            console.log(error);
            reject(error);
        }
            
    })
}

function filterTable(e){
    
    var search = e.path[0]; //search_id
    var searchID = search.id
    var value = search.value
    var bodyTab;
    var elementID = searchID.split('_')[1]; //id
    var tableDivID = e.path[5].id;
    var index;

    

    if(tableDivID==profileTableID){
        btn_next = document.getElementById("btn_next-profile");
        btn_prev = document.getElementById("btn_prev_profile");
        page_span = document.getElementById("pageProfile");
        obj = subsetProfiles;
        index = schemeGenes.indexOf(elementID);
        current_page_profile = 1;
        bodyTab = tableBodyProfile;

        if(value){
            profileTabelCondition = [value,index];
            
        } else {
            profileTabelCondition = null;
        }
        condition = profileTabelCondition;

       
    } else if(tableDivID == isolateTableID) {
        btn_next = document.getElementById("btn_next-aux");
        btn_prev = document.getElementById("btn_prev_aux");
        page_span = document.getElementById("pageAux");
        obj = isolateData;
        index = metadata.indexOf(elementID);
        current_page_aux = 1;
        bodyTab = tableBodyIsolate;

        if(value){
            isolateTableCondition = [value,index]
        } else {
            isolateTableCondition = null;
        }
        
        condition = isolateTableCondition;
    } 
    
    changePage(1,bodyTab); 
}
const filterTableInfo = function(v,i){
    return obj.filter(x => {
        for(var p in x){
            var data = x[p]; 
            if(data[i])        
                return data[i].includes(v);
            return false
        }
    })
}

function prevPageProfile()
{
    if (current_page_profile > 1) {
        btn_next = document.getElementById("btn_next-profile");
        btn_prev = document.getElementById("btn_prev_profile");
        page_span = document.getElementById("pageProfile");
        obj = subsetProfiles;
        condition = profileTabelCondition;
        current_page_profile--;
        changePage(current_page_profile,tableBodyProfile);
    }
}
function nextPageProfile()
{ 
    if(subsetProfiles && subsetProfiles.length>0){
        condition = profileTabelCondition;

        btn_next = document.getElementById("btn_next-profile");
        btn_prev = document.getElementById("btn_prev_profile");
        page_span = document.getElementById("pageProfile");    
        obj = subsetProfiles;

        if (current_page_profile < numPages()) {
            current_page_profile++;
            changePage(current_page_profile,tableBodyProfile);
        }
    }
    
}
function prevPageAux()
{
    
    if (current_page_aux > 1) {
        condition = isolateTableCondition;

        btn_next = document.getElementById("btn_next-aux");
        btn_prev = document.getElementById("btn_prev_aux");
        page_span = document.getElementById("pageAux");
        obj = isolateData;

        current_page_aux--;
        changePage(current_page_aux,tableBodyIsolate);
    }
}
function nextPageAux()
{
    if(isolateData && isolateData.length>0){
        condition = isolateTableCondition;

        btn_next = document.getElementById("btn_next-aux");
        btn_prev = document.getElementById("btn_prev_aux");
        page_span = document.getElementById("pageAux");
        obj = isolateData;

        if (current_page_aux < numPages()) {
            current_page_aux++;
            changePage(current_page_aux,tableBodyIsolate);
        }
    }
}
function changePage(page, tableBody)
{
    var dataToShow = [];

    if(condition){
        obj = filterTableInfo(condition[0],condition[1]);
    }

    if (page < 1) page = 1;
    if (page > numPages()) page = numPages();
    for (var i = (page-1) * records_per_page; i < (page * records_per_page) && i<obj.length; i++) {
        var x = obj[i]
        for(var property in x) {
            dataToShow.push(x[property])
        }
    }

    buildTableBody(dataToShow,tableBody)

    page_span.innerHTML = page;

    if (page == 1) {
        btn_prev.ariaDisabled = true;
    } else {
        btn_prev.ariaDisabled = false;
    }

    if (page == numPages()) {
        btn_next.ariaDisabled = true;
    } else {
        btn_next.ariaDisabled= false;
    }  
}

function numPages()
{
    return Math.ceil(obj.length / records_per_page);
}

//////////////////////// PIE CHARTS //////////////////////////////
const pieLabelRegion = 'pieLabelRegion'
const profilePieLabels ='#profilePieLabels'
const profilePieChartSVG = '#profilePieChartSVG'
const profilePieChartTitle = 'profilePieChartTitle'
const auxPieLabels = '#auxPieLabels'
const auxPieChartSVG = '#auxPieChartSVG'
const auxPieChartTitle = 'auxPieChartTitle'

const profilePieChartDiv = document.getElementById('profilePieChartDiv')
const auxPieChartDiv = document.getElementById('auxPieChartDiv')
const treeLabelsDiv = document.getElementById('treeLabelsDiv')
let pieCharProfiletKeys = [];
let pieChartAuxKeys = [];
let colors;
let pieData;

function newPieChart(event){  
    var header = event.currentTarget.innerHTML;
    var path = event.path;
    var divTabel = document.getElementById('profileTablePanel')
    if(path.includes(divTabel)){
        profilePieChartDiv.style.visibility = 'visible'
        if(pieCharProfiletKeys.length == 2 )
            pieCharProfiletKeys = [];   
        else if(pieCharProfiletKeys[0] == header) return; 
        pieCharProfiletKeys.push(header);
        buildPieChartProfileData(pieCharProfiletKeys)
            .then(elements => {
                buildPieChart(pieCharProfiletKeys, elements,profilePieChartSVG,profilePieLabels,profilePieChartTitle);
            })  
            .catch(message =>{alert(message)})
    } else {
        auxPieChartDiv.style.visibility = 'visible'
        if(pieChartAuxKeys.length == 2)
            pieChartAuxKeys = []
        else if(pieChartAuxKeys[0] == header) return;

        pieChartAuxKeys.push(header);
        buildPieChartAuxData(pieChartAuxKeys)
            .then(elements => {
                buildPieChart(pieChartAuxKeys, elements,auxPieChartSVG,auxPieLabels,auxPieChartTitle);
            })
            .catch(message =>{alert(message)})
        
    }  
}

function buildPieChart(names,data,id,legendID,titleID){
    
    var w = 250,
    h = 250;
    var  rds= 150; 
    d3.select(id).selectAll("*").remove();

    var svgPieChart = d3.select(id)
        .attr("viewBox", [-40, 0, 320, 240])
        .attr("width",w)
        .attr("height",h)
    
        pieData = buildJsonNumberOfOccurences(names,data);
    
    var keys = Object.keys(pieData);
    var obj = Object.entries(pieData);

   
    let gElement = svgPieChart.append("g")
        .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")")
        .attr("class","pie")

    var pie = d3.pie()
        .value(function(d) {return d[1]; });

    var ordScale = d3   
        .scaleSequential(d3.interpolateRainbow)
        .domain([0,keys.length])

    var arc = gElement
        .selectAll("arc")
        .data(pie(obj))
        .enter()
        

    var path = d3.arc()
        .innerRadius(50)
        .outerRadius(rds)
        
    var lbl;
    colors = {};
    arc.append("path")
        .attr("d", path)
        .attr("fill", 
            function(d) { 
                var dt  = d.data[0]
                var clr = ordScale(keys.indexOf(dt)); 
                if(!colors[dt])  colors[dt] = clr;
                //console.log(dt + '-' + clr);
                return clr;
        })
        .on('mouseover', function (d, i) {
            d3.select(this).transition()
                 .duration('50')
                 .attr('opacity', '.85')
            var divid = document.getElementById(titleID)    
            lbl =  divid.innerHTML;
            
            let percentage =  Math.round((i.endAngle - i.startAngle)/(2*Math.PI)*100*100)/100
            divid.innerHTML += `<br><i class="bi bi-archive-fill">${i.data[0]} Count: ${i.data[1]} - ${percentage}%</i>`
            })
       .on('mouseout', function (d, i) {
            d3.select(this).transition()
                 .duration('50')
                 .attr('opacity', '1')
            var divid = document.getElementById(titleID)    
            divid.innerHTML =  lbl;
            }); 
        

    buildPieChartLabels(colors,legendID);
    buildPieChartTitle(names,keys.length,titleID)

}

function buildPieChartLabels(colors,legendID){
    const legendrect = 'legendrect'
    var w = 100,
    h = 300;
    var jumpY = 20;
    var i = 0

    var size = Object.keys(colors).length * jumpY

    d3.select(legendID).selectAll("*").remove();
    var svgPieLabels = d3.select(legendID)
        .attr("viewBox", [0, 0, w, size])
    
    
    for(var element in colors){
        i++;
        //colors[element] => cor
        //element => valor

        var g = svgPieLabels.append('g')            
            .attr("transform","translate(0,"+jumpY*i+")")

        var rect = g.append('rect')
            .attr("width","15px")
            .attr("height","15px")
            .attr("class",legendrect+i)
            .attr("indexColor",i)
            
        rect.style("fill",colors[element])

        var text = g.append('text')
        
        text
            .attr("x",20)
            .attr("y",7.5)
            .attr("dy",".35em")

        text.style("font-size", "12.5px")
        text.node().innerHTML = element;
    }
}

function buildPieChartTitle(name,size,titleID){
    
    var divid = document.getElementById(titleID)
    if(name.length==1){
        divid.innerHTML =  `<h5><b>${name[0]}</b></h5><b>Total Categories: </b>${size}`
    } else {
        divid.innerHTML =  `<h5><b>${name[0]} & ${name[1]}</b></h5><b>Total Categories: </b>${size}`
    }
    
    divid.style.textAlign = 'center'
    
}

function buildJsonNumberOfOccurences(names,data){
    if(names.length == 1){
        var counts = {};
        var dt = data[names[0]]
        for (var i = 0; i < dt.length; i++) {
            var num = dt[i];
            counts[num] = counts[num] ? counts[num] + 1 : 1;
        }
        return counts;
    } else{
        var counts = {};
        var nm1 = names[0];
        var nm2 = names[1]
        var dt1 = data[nm1];
        var dt2 = data[nm2];
        for(var i = 0; i< dt1.length;++i){
            for(var j = 0; j< dt2.length;++j){
                var num = dt1[i] + '&' + dt2[j];
                counts[num] = counts[num] ? counts[num] + 1 : 1;
            }
        }
        return counts;
    }
}

function buildJsonSingleHeader(data){
    var counts = {};

    for (var i = 0; i < data.length; i++) {
        var num = data[i];
        counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    return counts;
   
}

function buildPieChartProfileData(pieKeys){
    return new Promise((resolve, reject) => {
        try{
            var elements = {};
            pieKeys.forEach( key => { 
                var index = schemeGenes.indexOf(key);
                var array = []
                subsetProfiles.forEach( row => {
                    array.push(row.profile[index]);
                })
                elements[key] = array
            })
            resolve(elements)
        } catch(x){
            reject('Error building Pie Chart');
            console.log(x.message);
        }
    })
}

function buildPieChartAuxData(pieKeys){
    return new Promise((resolve, reject) => {
        var elements = {}
        try{
            pieKeys.forEach(key =>{
                var index = metadata.indexOf(key);
                var array = []
                isolateData.forEach( row => {
                    array.push(row.isolate[index]);
                })
                elements[key] = array
            })
            
            resolve(elements)
        } catch(x){
            reject('Error building Pie Chart');
            console.log(x.message);
        }
    })
}

function buildJsonNumberOfOccurencesByIsolate(){
    return new Promise((resolve,reject) => {
        var data = {};
        
        try{
            if(pieChartAuxKeys.length == 1){
                var key = pieChartAuxKeys[0]
                var idIndex = metadata.indexOf(jsonData.data_type[0]);
                var infoIndex = metadata.indexOf(key);


                isolateData.forEach(element =>{
                    if(element.isolate){
                        var arr = element.isolate;
                        var st = arr[idIndex]
                        var value = arr[infoIndex]
                        if(!data[st])
                            data[st] = {}
                        data[st][value] = data[st][value] ? data[st][value]+1 : 1;
                    }
                })
            }
            else{
                var key1 = pieChartAuxKeys[0]
                var key2 = pieChartAuxKeys[1]
                var idIndex = metadata.indexOf(jsonData.data_type[0]);;
                var infoIndex1 = metadata.indexOf(key1);
                var infoIndex2 = metadata.indexOf(key2)

                isolateData.forEach(element =>{
                    if(element.isolate){
                        var arr = element.isolate;
                        var st = arr[idIndex];
                        var value = arr[infoIndex1]+'&'+arr[infoIndex2];
                        if(!data[st])
                            data[st] = {}
                        data[st][value] = data[st][value] ? data[st][value]+1 : 1;
                    }
                })
            }
            resolve(data);

        } catch(e){
            console.log(e.message);
        }
        
    })
}

function linkToTree(event){
    buildJsonNumberOfOccurencesByIsolate()
        .then(elements =>{
            buildNodePies(elements)
        })
    
}

function buildNodePies(data){
    var collapsedNodes = [];

    node.selectAll("circle")
            .style("fill",color);
    
    node.each(function (d) {
        
        /*if (d.isCollapsed){
            click(null,d)
            collapsedNodes.push(d);
        } */  
        drawNodePie(d3.select(this), data[d.key] ,d.pieChart)
    });

    //collapsedNodes.forEach(d=>click(null,d))
    

    home_tab.click()
    treeLabelsDiv.style.visibility = 'visible'
    buildPieChartLabels(colors,'#treeLabels')

}

function drawNodePie(nodeElement, data) {    
    if (!data) return;
    var elements = nodeElement._groups[0][0].children

    if(!elements[0].isCollapsed)
        drawPieChart(nodeElement, data);
}

function drawPieChart(nodeElement, data) {
    var radius = nodeSize(nodeElement);

    var keys = Object.keys(data);
    var obj = Object.entries(data);
    
    var pie = d3.pie()
        .value(function(d) {return d[1]; });

    var arc = nodeElement
        .selectAll("arc")
        .data(pie(obj))
        .enter()
        
    var path = d3.arc()
        .innerRadius(0)
        .outerRadius(radius)
        
    arc.append("path")
        .attr("d", path)
        .attr("fill", d => colors[d.data[0]])

    
    //node.selectAll('path').attr("style","z-index: 1;")
    //node.selectAll('text').attr("style","z-index: 2;")

    
}


function cleanProfileKeys(event){
    profilePieChartDiv.style.visibility = 'hidden';
    pieCharProfiletKeys = [];
}

function cleanAuxKeys(event){
    auxPieChartDiv.style.visibility = 'hidden'
    pieChartAuxKeys = [];
}

function removeNodePieCharts(){
    node.selectAll('path').remove()
    treeLabelsDiv.style.visibility = 'hidden'

}

/**
 * @param {String} message 
 * @param {(success|danger)} kind It is danger by default
 */
 function alertMsg(message, kind){
    if(!kind) kind = 'danger'
    document
        .querySelector('.messages')
        .innerHTML = 
            `<div class="alert alert-${kind} alert-dismissible" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
                ${message}
            </div>`
}

document.addEventListener('DOMContentLoaded', setEventListenners)