window.onload = setup 


const height = window.innerHeight;
const width = window.innerWidth;
const radius = 8;
let root;
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

function setup(){
    var script = document.getElementById('forceDirectedLayout');
    var tree = JSON.parse(script.getAttribute('tree'));
    links = tree.links
    nodes = tree.nodes

    start();

    switchLabels.addEventListener('change', function () {
        checker(this.checked)
    })

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
        .force("charge", d3.forceManyBody().strength(-5))
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
        .attr("cx", function(d) { return d.x = Math.max(radius, Math.min((width) - radius, d.x)); })
        .attr("cy", function(d) { return d.y = Math.max(radius, Math.min((height) - radius, d.y)); });
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