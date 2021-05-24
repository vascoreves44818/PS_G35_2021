window.onload = setup 

const height = window.innerHeight;
const width = window.innerWidth;
let root;
let links = [], nodes = [];
let node, link;
let simulation;

const svg = d3.select("svg")
    .attr("viewBox", [0, 0, width, height]);


function setup(){
    var script = document.getElementById('forceDirectedLayout');
    root = script.getAttribute('tree');

    update();
    createGraph();
    startSimulation();
}

function update() {
    flatten(root[0]);
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
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 5)
        .call(d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
        );

    node.append("text")
        .attr("x", 30 + 4)
        .attr("y", "0.31em")
        .text(d => d.name)
        .clone(true).lower()
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("stroke-width", 3);

    node.select("circle")
        .style("fill", color);
}

function startSimulation(){
    simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.name))
        .force("charge", d3.forceManyBody().strength(-30))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .on("tick", ticked);
}

function ticked() {
    link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
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