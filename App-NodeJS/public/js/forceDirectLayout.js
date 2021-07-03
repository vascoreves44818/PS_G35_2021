window.onload = setup 

function setup(){
    var script = document.getElementById('forceDirectedLayout');

    var data = script.getAttribute('json');

    var navTab = document.getElementById('graphicTab')
    navTab.style.visibility = 'visible';
    var graphicControls = document.getElementById('graphicControls')
    graphicControls.style.visibility = 'visible'
    
    try{
        data = JSON.parse(data);
    } catch(x){
        console.log(x);
        alert('Problem reading information. Insert again.')
    }

    links = data.links
    nodes = data.nodes
    metadata = data.metadata
    schemeGenes = data.schemeGenes
    subsetProfiles =  data.subsetProfiles;
    isolateData = data.isolatesData;

    init(); 
    setGraphicFilters();
    createTables();

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
}

/////////////////// FORCE DIRECT LAYOUT ///////////////////////////

const height = window.innerHeight;
const width = window.innerWidth;
const radius = 20;
let links = [], nodes = [];
let metadata = [], schemeGenes = [];
let subsetProfiles = [], isolateData =[];
var min_zoom = 0.1;
var max_zoom = 7;
let paused = false;
let pinned = false;
let simulation;
let svg;
let link;
let linkText;
let g;
var colorExpand = "#c6dbef";
var colorCollapse = "#3182bd";
const nodelabels = 'nodelabels';
const linklabels ='linklabels';


const colorSequence = d3.interpolateSinebow;


const switchNodeLabels = document.getElementById('NodeLabelsSwitch')
const rangeNodeLabelSize = document.getElementById('NodeLabelsRange')

const switchLinkLabels = document.getElementById('LinkLabelsSwitch')
const rangeLinkLabelSize = document.getElementById('LinkLabelsRange')

const chargeForceRange = document.getElementById('chargeForceRange')
const colideForceRange = document.getElementById('colideForceRange')

const profileColorFilter = document.getElementById('profileColorFilter');
const isolateColorFilter = document.getElementById('isolateColorFilter');

function init(){
    svg = d3.select('#svgCanvas')
        .attr("viewBox", [0, 0, width, height]);

    link = svg.selectAll(".link"), node = svg.selectAll(".node");
    g = svg.append("g");

    const zoom = d3.zoom()
        .extent([[0, 0], [width, height]])
        .scaleExtent([0.1, 8])
        .on("zoom", zoomed);

    svg.call(zoom);
    start();
}

function zoomed({transform}) {
    g.attr("transform", transform);
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
        .attr("dy", ".35em")
        .text(d=>d.value);

    node = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .join("g")

    node
        .attr("id", d => d.key+"_node")
        .append("circle")
        .attr("id", d => d.key)
        .attr("r",  radius)
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
    var linkForce = d3.forceLink(links);
    linkForce.id(d => d.key);
    linkForce.distance(d => d.value);

    simulation = d3.forceSimulation(nodes)
        .force("link", linkForce)
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width /2 , height/2))
        .force("collide", d3.forceCollide().radius(radius+2))
        .alphaTarget(1)
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

///// GRAPHIC FORCES ////////

function changeChargeForce(){
    var value = chargeForceRange.value
    simulation.force("charge", d3.forceManyBody().strength(value))
    simulation.restart();
}

function changeColideForce(){
    var value = colideForceRange.value

    simulation
        .force("collide", d3.forceCollide().strength(value)).alphaTarget(1)

}
function resetForces(){
    simulation
        .force("charge", d3.forceManyBody().strength(-100))
        .force("collide", d3.forceCollide().radius(radius+5))
        .on('tick',ticked)
    simulation.restart();

    chargeForceRange.value = -100;
    colideForceRange.value = 1;
}
 
function color(d,value) {
    if(d.isCollapsed)
        return colorCollapse;
    if(value){
        var x = value(d);
        return x ? colorSequence(1/x) : colorExpand;
    }
    return colorExpand;


}

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

        if (visibility==null || visibility=='visible'){
            element.setAttribute("visibility","hidden")
        } else {
            if((type==nodelabels || type==linklabels) && !switchNodeLabels.checked)
                element.setAttribute("visibility","hidden")
            else
                element.setAttribute("visibility","visible")

        }
        
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

/**
 * 
 * @param {Array table rows} data 
 * @param {HTML div} tableDiv 
 * @returns 
 */
function buildTable(data,tableDiv,headers){
    tableDiv.innerHTML = ""
    var table = document.createElement('table')
    table.setAttribute('class','table table-striped table-bordered table-hover')

    //CREATE TABLE HEADERS
    var tableHead = document.createElement('thead');
    var tableTRhead = document.createElement('tr')
    tableHead.appendChild(tableTRhead)
        
    headers.forEach(element => {
        var headerElement = document.createElement('th')
        headerElement.setAttribute('id',element);

        var linkHeader = document.createElement('a')
        linkHeader.setAttribute('class', 'nounderline btn-lg')
        linkHeader.onclick = newPieChart;
        linkHeader.innerHTML = element
       
        headerElement.appendChild(linkHeader);
        tableTRhead.appendChild(headerElement);
    })
    table.appendChild(tableHead);

    //CREATE TABLE BODY
    var tableBody = document.createElement('tbody');
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
    table.appendChild(tableBody);

    //APPEND TABLE TO TABLE DIV
    tableDiv.appendChild(table);
    return;
}

function createTables(){
    try{
        if(subsetProfiles && subsetProfiles.length>0){    
            changePage(1,'profile');
        }
        if(isolateData && isolateData.length>0){
            changePage(1,'aux');
            
        }
    } catch(x){
        console.log(x);
    }
    
   
}

function prevPageProfile()
{
    if (current_page_profile > 1) {
        current_page_profile--;
        changePage(current_page_profile,'profile');
    }
}
function nextPageProfile()
{
    if(subsetProfiles && subsetProfiles.length>0){    
        obj = subsetProfiles;
        if (current_page_profile < numPages()) {
            current_page_profile++;
            changePage(current_page_profile,'profile');
        }
    }
    
}
function prevPageAux()
{
    if (current_page_aux > 1) {
        current_page_aux--;
        changePage(current_page_aux,'aux');
    }
}
function nextPageAux()
{
    if(isolateData && isolateData.length>0){
        obj = isolateData;
        if (current_page_aux < numPages()) {
            current_page_aux++;
            changePage(current_page_aux,'aux');
        }
    }
}

function changePage(page, type)
{
    var page_span;
    var div;
    var btn_next, btn_prev;
    var headers;
    var dataToShow = [];
    
    

    if(type == 'profile'){
        div = document.getElementById('profileTabel')
        btn_next = document.getElementById("btn_next-profile");
        btn_prev = document.getElementById("btn_prev_profile");
        page_span = document.getElementById("pageProfile");
        obj = subsetProfiles;
        headers = schemeGenes;
        if (page < 1) page = 1;
        if (page > numPages()) page = numPages();
        for (var i = (page-1) * records_per_page; i < (page * records_per_page) && i<obj.length; i++) {
            dataToShow.push(obj[i].profile);
        }
    }
    else {
        div = document.getElementById('auxTable');
        btn_next = document.getElementById("btn_next-aux");
        btn_prev = document.getElementById("btn_prev_aux");
        page_span = document.getElementById("pageAux");
        obj = isolateData;
        headers = metadata;
        if (page < 1) page = 1;
        if (page > numPages()) page = numPages();
        for (var i = (page-1) * records_per_page; i < (page * records_per_page) && i<obj.length; i++) {
            dataToShow.push(obj[i].isolate);
        }
    }
        
   
     
    
    

    page_span.innerHTML = page;

    buildTable(dataToShow,div,headers);
    
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
    var radius = 150; //Math.min(w, h) / 2 - margin;
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
        .outerRadius(radius);
                
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