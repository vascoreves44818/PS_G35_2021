window.onload = setup 

function setup(){
    var script = document.getElementById('forceDirectedLayout');
    var data = script.getAttribute('json');
    
    try{
        data = JSON.parse(data);
    } catch(x){
        console.log(x);
        alert('Problem reading information. Insert again.');
        return;
    }

    links = data.links
    nodes = data.nodes
    metadata = data.metadata
    schemeGenes = data.schemeGenes
    subsetProfiles =  data.subsetProfiles;
    isolateData = data.isolatesData;

    init(); 
    setVisibleControls();
    setGraphicFilters();
    createTables();
    setEventListenners();

}

function setVisibleControls(){
    var navTab = document.getElementById('graphicTab')
    navTab.style.visibility = 'visible';
    var graphicControls = document.getElementById('graphicControls')
    graphicControls.style.visibility = 'visible'
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
    /*nodeLogScale.addEventListener('change', function(){
        nodeRadious = checkNodeLogScale(this.checked);
    })*/
    linkStrokeRange.addEventListener('input',changeLinkStroke)

    
}

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

/////////////////// FORCE DIRECT LAYOUT ///////////////////////////

const height = window.innerHeight;
const width = window.innerWidth;
const defaultcollideForce = 5;
const defaultStrength = -20;
const defaultNodeSize = 25;

const svgCanvas ='#svgCanvas';
const nodelabels = 'nodelabels';
const linklabels ='linklabels';
const colorExpand = "lightGray";
const colorCollapse = "#000000";

//const colorCollapse = "#3182bd";

let nodeScaleFactor =  NodeSizeRange.value;
let sizeKey;
let linkStroke = 1.5;
var strength = defaultStrength;
var collideForce = defaultcollideForce;

let linkForce;
var linkDistance = function(d){return d.value ? d.value : 1};
//var nodeRadious= checkNodeLogScale(checkNodeLogScale.checked);

/*var withLog = function(d){
    if(!d.backupSize) d.backupSize = DefaultnodeSize 
    d.backupSize = Math.log10(d.backupSize) * DefaultnodeSize + (d.isolates.length * nodeScaleFactor);
    d.size = d.backupSize;
    return d.size;

}
var withoutLog = function(d){
    d.backupSize = DefaultnodeSize + (d.isolates.length * nodeScaleFactor);
    d.size = d.backupSize;
    return d.size;
}*/

function nodeSize(d){
    var expr1 = defaultNodeSize;
    var expr2 = (sizeKey ? d[sizeKey].length : 1) * nodeScaleFactor; 
    
    if(nodeLogScale.checked){
        d.backupSize = d.backupSize ? d.backupSize : expr1 + expr2;
        expr1 = defaultNodeSize * Math.log10(d.backupSize)
    }
    d.backupSize = expr1 + expr2
    d.size = d.backupSize;
           
    return d.size;
    
}

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


const colorSequence = d3.interpolateSinebow;
function color(node,value){
    if(node.isCollapsed)
        return colorCollapse;
    if(value){
        var x = value(node);
        return x ? x : colorExpand;
    }
    return colorExpand;
}

function init(){
    svg = d3.select(svgCanvas)
        .attr("viewBox", [0, 0, width*2, height*2]);

    link = svg.selectAll(".link")
    node = svg.selectAll(".node");
    g = svg.append("g");

    const zoom = d3.zoom()
        .on("zoom", function({transform}){
            g.attr("transform", transform);
        });

    svg.call(zoom);
    start();
}

function start(){

    link = g.append("g")
        .attr("class", "link")
        .selectAll('g')
        .data(links)
        .enter()
        .append("g")
        .attr("class", "links")
        .attr("id", d => (d.source+'-'+d.target))
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
        
    checker(switchNodeLabels.checked)
    checkerLinks(switchLinkLabels.checked)
 
    node.selectAll("circle")
        .style("fill", color);

    node.call(d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    );
    startSimulation();
}

function startSimulation(){
    linkForce = d3.forceLink(links);
    linkForce.id(d => d.key);
    linkForce.distance(linkDistance);

    simulation = d3.forceSimulation(nodes)
        .force("link", linkForce)
        .force("charge", d3.forceManyBody().strength(strength))
        .force("center", d3.forceCenter(width /2 , height/2))
        .force("collide", d3.forceCollide().radius(d=>collideForce))
        .alphaTarget(0.8)
        .on("tick", ticked);
}

///// GRAPHIC LABELS //////
function checker(checked) {
    checked ? showLabels(nodelabels) : hideLabels(nodelabels)
}

function checkerLinks(checked) {
    checked ? showLabels(linklabels) : hideLabels(linklabels)
}
  
function showLabels(className) {
    var labels = document.getElementsByClassName(className)
    for (i = 0; i < labels.length; i++) {
        if(!labels[i].isCollapsed)
            labels[i].setAttribute("visibility","visible");
    }
}

function hideLabels(className) {
    var labels = document.getElementsByClassName(className)
    for (i = 0; i < labels.length; i++) {
        if(!labels[i].isCollapsed)
            labels[i].setAttribute("visibility","hidden");
    }
}

function changeNodeLabelSize(){
    var size = rangeNodeLabelSize.value
    node.selectAll("text")
        .style("font-size",size)
}

function changeLinkLabelSize(){
    var size = rangeLinkLabelSize.value
    linkText
        .style("font-size",size)
}

/////// NODE AND LINK SIZE ////////
function changeNodeSize(){
    nodeScaleFactor = NodeSizeRange.value
    sizeKey = nodeSizeKey.value;
    node.selectAll("circle")
        .attr("r", nodeSize);


}
/*
function checkNodeLogScale(checked){ 
    return checked ? withLog : withoutLog;
    //changeNodeSize();
}*/

function changeLinkStroke(){
    linkStroke = linkStrokeRange.value
    link
        .style("stroke-width",linkStroke)
}

///// GRAPHIC FORCES ////////
function changeChargeForce(){
    strength = chargeForceRange.value
    simulation.force("charge", d3.forceManyBody().strength(strength))
}

function changeColideForce(){
    collideForce = colideForceRange.value
    simulation
        .force("collide", d3.forceCollide().radius(d => collideForce*nodeSize(d)))

}

function resetForces(){
    strength = defaultStrength;
    collideForce = defaultcollideForce;
    chargeForceRange.value = strength ;
    colideForceRange.value = collideForce;
    changeChargeForce();
    changeColideForce();
}
 
/////// GRAPHIC MOVEMENT ////////
function click(event, node){
    console.log("NODE CLICKED")
    var changeColor = document.getElementById(node.key)

    var isNodeLeaf = true;
    var isCollapsing = node.isCollapsed ? false : true;
    node.isCollapsed = isCollapsing;
    
    
    recurse(node.key)
    

    function recurse(key){
        links.forEach(n => {
            var source = n.source;
            var target = n.target;
            if(source.key == key){
                //CHECK IF IS LEAF NODE
                isNodeLeaf = false;

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

        if (visibility==null || visibility=='visible')
            element.setAttribute("visibility","hidden")
        else if((type==nodelabels && !switchNodeLabels.checked) || (type==linklabels && !switchLinkLabels.checked))
                element.setAttribute("visibility","hidden")
        else
                element.setAttribute("visibility","visible")
        
    }

    if(isNodeLeaf){ node.isCollapsed = !node.isCollapsed; }
    else if(isCollapsing){ 
        node.previousColor = changeColor.style.fill;
        changeColor.style.fill = color(node)
    }else{
        changeColor.style.fill = node.previousColor
        node.previousColor = null;
    }
    
    
    
    
}

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
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.subject.fx = d.x;
    d.subject.fy = d.y;

}

function dragged(d) {
    d.subject.fx = d.x;
    d.subject.fy = d.y;
}

function dragended(d) {
    if (!event.active) simulation.alphaTarget(0);
    d.subject.fx = null;
    d.subject.fy = null;
}

/////// GRAPHIC BUTTONS ///////////////
function restartSimulation(){
    /*simulation.stop();
    g.selectAll("*").remove();
    start();*/
}

function pauseSimulation(){
    if(paused){
        simulation.restart();
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
        simulation.stop();
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

//////// DATA FILTERS /////////

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
function changeColorByProfile(e,k){
    var colorScheme = {}
    var key = k ? k : profileColorFilter.value;

    if(key.includes('None') || key.includes('UNKNOWN')){
        node.selectAll("circle")
            .style("fill",d => color(d));
        return;
    }

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
        if(d.profile[index]){  
            var clr = myScale(keys.indexOf(d.profile[index]))
            //console.log(clr +'-' + d.profile[index])
            return clr;  
        }
        return null;
        }

    node.selectAll("circle")
        .style("fill",x => color(x,value));
    
}

function changeColorByIsolate(e,k){
    var colorScheme = {}
    var key = k ? k : isolateColorFilter.value;
    if(key.includes('None') || key.includes('UNKNOWN')){
        node.selectAll("circle")
            .style("fill",d => color(d));
        return;
    }
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
        if(d.isolates){
            var clr = myScale(keys.indexOf(d.isolates[index]))
            //console.log(clr +'-' + d.isolates[index])
            return clr;
        } 
        return null;
    }

    node.selectAll("circle")
        .style("fill",x => color(x,value));

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

function newPieChart(event){  
    var header = event.currentTarget.innerHTML;
    var path = event.path;
    var divTabel = document.getElementById('profileTablePanel')
    if(path.includes(divTabel)){
        //event.currentTarget.setAttribute("data-target","#profilePieChartDiv")
        var index = schemeGenes.indexOf(header);
        var elements = []
        subsetProfiles.forEach( row => {
            elements.push(row.profile[index]);
        })
        buildPieChart(header, elements,'#profilePieChartSVG','#profilePieLabels');
    } else {
        //event.currentTarget.setAttribute("data-target","#auxPieChartDiv")

        var index = metadata.indexOf(header);
        var elements = []
        isolateData.forEach( row => {
            elements.push(row.isolate[index]);
        })
        buildPieChart(header, elements,'#auxPieChartSVG','#auxPieLabels');
    }  
}

function buildPieChart(name,data,id,legendID){
    
    var w = 300,
    h = 300;
    var  rds= 150; 
    d3.select(id).selectAll("*").remove();

    var svgPieChart = d3.select(id)
        .attr("viewBox", [0, 0, 320, 310])
        .attr("width",w)
        .attr("height",h)
        


    data = buildJsonNumberOfOccurences(data);
    
    var keys = Object.keys(data);
    var obj = Object.entries(data);

   
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
        .innerRadius(0)
        .outerRadius(rds);
          
    var colors = {};
    arc.append("path")
        .attr("d", path)
        .attr("fill", 
            function(d) { 
                var dt  = d.data[0]
                var clr = ordScale(keys.indexOf(dt)); 
                if(!colors[dt])  colors[dt] = clr;
                //console.log(dt + '-' + clr);
                return clr;
        });   
    buildPieChartLabels(colors,legendID);

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

function buildJsonNumberOfOccurences(data){
    var counts = {};

    for (var i = 0; i < data.length; i++) {
        var num = data[i];
        counts[num] = counts[num] ? counts[num] + 1 : 1;
    }
    return counts;
   
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