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
    nodeLogScale.addEventListener('change', function(){
        checkNodeLogScale(this.checked);
    })
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

const linkStrokeRange = document.getElementById('linkStrokeRange');

const height = window.innerHeight;
const width = window.innerWidth;

/////////////////// FORCE DIRECT LAYOUT ///////////////////////////

const defaultcollideForce = 1.1;
const defaultStrength = -2;
const nodelabels = 'nodelabels';
const linklabels ='linklabels';
const colorExpand = "#000000";
const colorCollapse = "#3182bd";

let radius = 50;
let linkStroke = 1.5;
var strength = defaultStrength;
var collideForce = defaultcollideForce;

let linkForce;
var linkDistance = function(d){return d.value ? d.value+nodeRadious(d) : nodeRadious(d)};
var nodeRadious = function(d){
    return Math.log(d.size ? d.size*(radius*radius) : (radius*radius));
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
function color(d,value){
    if(d.isCollapsed)
        return colorCollapse;
    if(value){
        var x = value(d);
        return x ? colorSequence(1/x) : colorExpand;
    }
    return colorExpand;


}

function init(){
    svg = d3.select('#svgCanvas')
        .attr("viewBox", [0, 0, width, height]);

    link = svg.selectAll(".link"), node = svg.selectAll(".node");
    g = svg.append("g");

    const zoom = d3.zoom()
        .on("zoom", function({transform}){
            g.attr("transform", transform);
        });

    svg.call(zoom);
    start();
}

function start() {

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
        .attr("r", nodeRadious)
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
        .force("charge", d3.forceManyBody().strength(d=>strength*linkDistance(d)))
        .force("center", d3.forceCenter(width /2 , height/2))
        .force("collide", d3.forceCollide().radius(d => collideForce*nodeRadious(d)))
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
    radius = NodeSizeRange.value
    node.selectAll("circle")
        .attr("r", nodeRadious);


}

function checkNodeLogScale(checked){
    var withLog = function(d){
        return Math.log(d.size ? d.size*(radius*radius) : (radius*radius));
    }
    var withoutLog = function(d){
        return d.size ? d.size+radius : radius;
    }
    nodeRadious = checked ? withLog : withoutLog;
    changeNodeSize();
}

function changeLinkStroke(){
    linkStroke = linkStrokeRange.value

    link
        .style("stroke-width",linkStroke)
}

///// GRAPHIC FORCES ////////
function changeChargeForce(){
    strength = chargeForceRange.value
    simulation.force("charge", d3.forceManyBody().strength(d=>strength+linkDistance(d)))
}

function changeColideForce(){
    collideForce = colideForceRange.value
    simulation
        .force("collide", d3.forceCollide().radius(d => collideForce*nodeRadious(d)))

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
    if (!event.active) simulation.alphaTarget(0.8).restart();
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
    /*
    var btnPinNodes = document.getElementById('btn_pin_nodes');
    
    if(pinned == true){
        node.call(d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );
        btnPinNodes.setAttribute('class','btn btn-sm btn-outline-dark');
        pinned = false;
    } else {
        
        simulation.stop();
        
        node.call(d3
            .drag()
            .on("start", dragFixedstarted)
            .on("drag", draggedFixed)
            .on("end", dragFixedended)
        );
        btnPinNodes.setAttribute('class','btn btn-sm btn-dark');
        pinned = true;
    }
    
    function dragFixedstarted(d) {
        //if (!event.active) simulation.alphaTarget(0.8).restart();
        d.subject.fx = d.x;
        d.subject.fy = d.y;
    }
    
    function draggedFixed(d) {
        d.subject.fx = d.x;
        d.subject.fy = d.y;
    }
    
    function dragFixedended(d) {
        if (!event.active) simulation.alphaTarget(0);
        d.subject.fx = null;
        d.subject.fy = null;
    }*/
    
        
}

//////// DATA FILTERS /////////

function setGraphicFilters(){
    if(schemeGenes){
        schemeGenes.forEach( x => {
            var opt = document.createElement('option');
            opt.value = x;
            opt.innerHTML = x;
            profileColorFilter
                .append(opt);
        })
    }
        
    if(metadata){
        metadata.forEach( x => {
            var opt = document.createElement('option');
            opt.value = x;
            opt.innerHTML = x;
            isolateColorFilter
                .append(opt);
        })
    }
    
}

function changeColorByProfile(){
     
    var key = profileColorFilter.value;
    var index = schemeGenes.indexOf(key);
    var value = function(d){ 
        if(d.profile) 
            return d.profile[index] 
        return null;
    }

    node.selectAll("circle")
        .style("fill",x => color(x,value));
    
}

function changeColorByIsolate(){
    var numbers =[];
    let id = 1;
    var key = isolateColorFilter.value;
    var index = metadata.indexOf(key);
    var value = function(d){ 
        if(d.isolates){
            var iso = d.isolates[index] 
            if(!numbers[iso]){
                numbers[iso] = id;
                id++; 
            }
            return numbers[iso];

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

function newPieChart(event){  
    var header = event.currentTarget.innerHTML;
    var path = event.path;
    var divTabel = document.getElementById('profileTablePanel')
    if(path.includes(divTabel)){
        var index = schemeGenes.indexOf(header);
        var elements = []
        subsetProfiles.forEach( row => {
            elements.push(row.profile[index]);
        })
        buildPieChart(header, elements,'#profilePieChartSVG')
        
    } else {
        var index = metadata.indexOf(header);
        var elements = []
        isolateData.forEach( row => {
            elements.push(row.isolate[index]);
        })
        buildPieChart(header, elements,'#auxPieChartSVG')
    }  
}

function buildPieChart(name,data,id){
    
    var w = 400,
    h = 400,
    margin = 40;
    var  rds= 150; //Math.min(w, h) / 2 - margin;
    d3.select(id).selectAll("*").remove();

    var svgPieChart = d3.select(id)
                            .attr("width",w)
                            .attr("height",h)

    data = buildJson(data);
    var keys = Object.keys(data);
    var obj = Object.entries(data);

   
    let gElement = svgPieChart.append("g")
        .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")")
        .attr("class","pie")

    var pie = d3.pie()
        .value(function(d) {return d[1]; });

    var ordScale = d3.scaleOrdinal()
                            .domain(keys)
                            .range(d3.schemeDark2);

    var arc = gElement
        .selectAll("arc")
        .data(pie(obj))
        .enter()

    var path = d3.arc()
        .innerRadius(0)
        .outerRadius(rds);
                
    arc.append("path")
        .attr("d", path)
        .attr("fill", 
            function(d) { 
                return ordScale(d.data[0]); 
        });   
}

function buildJson(data){
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