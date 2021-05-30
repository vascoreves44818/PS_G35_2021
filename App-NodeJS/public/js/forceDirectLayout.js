window.onload = setup 

const height = window.innerHeight;
const width = window.innerWidth;
const radius = 8;
let root;
let links = [], nodes = [];

let simulation;

let svg = d3.select('#GraphCanvas')
    .attr("viewBox", [0, 0, width, height]);

let link = svg.selectAll(".link"),
node = svg.selectAll(".node");

function setup(){
    var script = document.getElementById('forceDirectedLayout');
    var tree = script.getAttribute('tree');
    root = JSON.parse(tree)
    start();
    

}

function start() {
    root.forEach(flatten);
    createGraph();
    
}

function color(d) {
    return d._branshset ? "#3182bd" // collapsed package
        : d.branchset ? "#c6dbef" // expanded package
            : "#fd8d3c"; // leaf node
}

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

function createGraph() {

    link = svg.append("g")
        .attr("class", "link")
        .selectAll("line")
        .data(links)
        .enter().append("line")

    node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .join("g")
    
    node.append("circle")
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
    if (node.branchset) {
        node._branshset = node.branchset;
        node.branchset = null;
    } else {
        node.branchset = node._branshset;
        node._branshset = null;
    }

       
  
}

function updateRoot(n) {   
    function recurse(node){
        if(node.name === n.name){
            node = n;
            return;
        } 
        if (node.branchset){
            node.branchset.forEach(function(n){
                recurse(n)
            });
        }  
    }
    root.forEach(recurse);
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