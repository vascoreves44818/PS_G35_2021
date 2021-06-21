window.onload = setup 

function setup(){
    var script = document.getElementById('forceDirectedLayout');

    var data = script.getAttribute('json');
    var pd = script.getAttribute('profileInfo');
    var ad = script.getAttribute('auxiliaryInfo');

    var navTab = document.getElementById('graphicTab')
    navTab.style.visibility = 'visible';
    
    data = JSON.parse(data);
    links = data.links
    nodes = data.nodes

    start();
    createTables(pd,ad);

    switchLabels.addEventListener('change', function () {
        checker(this.checked)
    })
}

/////////////////// FORCE DIRECT LAYOUT ///////////////////////////

const height = window.innerHeight;
const width = window.innerWidth;
const radius = 8;
let links = [], nodes = [];
var min_zoom = 0.1;
var max_zoom = 7;

const switchLabels = document.getElementById('NodeLabels')

let simulation;

let svg = d3.select('#svgCanvas')
    .attr("viewBox", [0, 0, width, height]);

let link = svg.selectAll(".link"), node = svg.selectAll(".node");
const g = svg.append("g");

const zoom = d3.zoom()
    .extent([[0, 0], [width, height]])
    .scaleExtent([1, 8])
    .on("zoom", zoomed);

svg.call(zoom);

function zoomed({transform}) {
    g.attr("transform", transform);
}

function checker(checked) {
    checked ? showLabels() : removeLabels()
}
  
function showLabels() {
    var labels = document.getElementsByClassName('labels')
    for (i = 0; i < labels.length; i++) {
        if(!labels[i].collapsed)
            labels[i].setAttribute("visibility","visible");
    }
}

function removeLabels() {
    var labels = document.getElementsByClassName('labels')
    for (i = 0; i < labels.length; i++) {
        labels[i].setAttribute("visibility","hidden");
    }
}
  
function color(d) {
    return d._branchset ? "#3182bd" // collapsed package
            : d.branchset ? "#c6dbef" // expanded package
            : "#fd8d3c"; // leaf node
}

function start() {

    link = g.append("g")
        .attr("class", "link")
        .selectAll("line")
        .data(links)
        .enter()
        .append("line")
        .attr("id", d => (d.source+d.target))

    node = g.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .join("g")

    
    node
        .attr("id", d => d.name+"_node")
        .append("circle")
        .attr("id", d => d.name)
        .attr("r", radius)
        .on('click', click)
        .call(d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

    node.append("text")
        .attr("class","labels")
        .attr('x', 6)
        .attr('y', 3)
        .text(d => d.name)

        
    node.selectAll("circle")
        .style("fill", color);



    startSimulation();
}

function startSimulation(){
    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.name))
        .force("charge", d3.forceManyBody().strength(-10))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);
}

function click(event, node){
    console.log("CLICKED")

    node.collapsed = node.collapsed ? false : true;

    recurse(node.name)

    function recurse(name){
        links.forEach(n => {
            var source = n.source;
            var target = n.target;
            if(source.name == name){
                recurse(target.name)
                //GET NODE ELEMENT
                var nd = document.getElementById(target.name+"_node");
                var elements = nd.children
                
                //CHANGE VISIBILITY TO NODE AND TEXT
                for(let i = 0; i<elements.length ; ++i){
                    elements[i].collapsed = elements[i].collapsed ? false : true;
                    changeVisibility(elements[i])
                }

                //CAHNGE VISIBILITY TO LINK
                var lk = document.getElementById(source.name+target.name);
                changeVisibility(lk)
            }
        })
    
    }

    function changeVisibility(element){
        var visibility = element.getAttribute('visibility')
        var type = element.className.baseVal 

        if (visibility==null || visibility=='visible'){
            element.setAttribute("visibility","hidden")
        } else {
            if(type=='labels' && !switchLabels.checked)
                element.setAttribute("visibility","hidden")
            else
                element.setAttribute("visibility","visible")

        }
        
    }

    //CHANGE COLOR FOR COLLAPSED PACKAGES
    if(node.branchset){
        node._branchset = node.branchset
        node.branchset = null;
    } else {
        node.branchset = node._branchset;
        node._branchset = null;
    }

    var changeColor = document.getElementById(node.name)
    changeColor.style.fill = color(node)
    
}

function ticked() {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

     
    node
        .attr("transform", function(d) {
                    return "translate(" + d.x + "," + d.y + ")";
        })
        .attr("cx", function(d) { return d.x})
        .attr("cy", function(d) { return d.y});
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

///////////////////// TABLES ////////////////////////////////

var current_page_profile = 1;
var current_page_aux = 1;
var records_per_page = 10;
let obj;
let pData;
let auxData;
let profileHeaders;
let auxiliaryHeaders;


/**
 * 
 * @param {Array table rows} data 
 * @param {HTML div} tableDiv 
 * @returns 
 */
function buildTable(data,tableDiv,headers){
    tableDiv.innerHTML = ""
    var table = document.createElement('table')
    table.setAttribute('class','table table-striped table-bordered')

    //CREATE TABLE HEADERS
    var tableHead = document.createElement('thead');
    var tableTRhead = document.createElement('tr')
    tableHead.appendChild(tableTRhead)
        
    headers.forEach(element => {
        var headerElement = document.createElement('th')
        headerElement.innerHTML=element;
        headerElement.setAttribute('id',element);
        tableTRhead.appendChild(headerElement);
    })
    table.appendChild(tableHead);

    //CREATE TABLE BODY
    var tableBody = document.createElement('tbody');
    data.forEach(row => {
        var items = row.split('\t');
        var tableTR = document.createElement('tr');
        tableBody.appendChild(tableTR);

        items.forEach(element => {
            var tableElement = document.createElement('th')
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


function createTables(profile,aux){
    if(profile && profile!='auxiliaryInfo='){    
        pData = JSON.parse(profile)
        profileHeaders = pData.shift();        
        changePage(1,'profile');
        
    }
    if(aux){
        auxData = JSON.parse(aux)
        auxiliaryHeaders = auxData.shift();
        changePage(1,'aux');
        
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
    if(pData){
        obj = pData;
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
    if(auxData){ 
        obj = auxData;
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

    if(type == 'profile'){
        div = document.getElementById('profileTabel')
        btn_next = document.getElementById("btn_next-profile");
        btn_prev = document.getElementById("btn_prev_profile");
        page_span = document.getElementById("pageProfile");
        obj = pData;
        headers = profileHeaders.split('\t');
    }
    else {
        div = document.getElementById('auxTable');
        btn_next = document.getElementById("btn_next-aux");
        btn_prev = document.getElementById("btn_prev_aux");
        page_span = document.getElementById("pageAux");
        obj = auxData;
        headers = auxiliaryHeaders.split('\t');
    }
        
    // Validate page
    if (page < 1) page = 1;
    if (page > numPages()) page = numPages();
     
    var dataToShow = []
    for (var i = (page-1) * records_per_page; i < (page * records_per_page) && i<obj.length; i++) {
        dataToShow.push(obj[i]);
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