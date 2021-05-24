var t0 = performance.now();
console.log(t0);

var svg = d3.select("svg");

var height = window.innerHeight;
var width =  window.innerWidth;

svg = svg
    .attr("viewBox", [0, 0, width, height]);

var nodes = []
var allNodes = []
var links = []

var simulation;


fetch('./../data/smallTree.txt')
    .then(response => response.text())
    .then(text => {
        var result = text.split(/\r?\n/);
        result.forEach(txt => {
            var str = txt.split(' ')
            var source = str[0]
            var target = str[2]
            links.push({"source":source,"target":target})

            if ( !allNodes.includes(source) ) {
                nodes.push({'id':source})
            }
            allNodes.push(source)

            if ( !allNodes.includes(target) ) {
                nodes.push({'id':target})
            }
            allNodes.push(target)
        })
    }).then(_ => {

        simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id))
            .force("charge", d3.forceManyBody().strength(-30))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked);


        const link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(links)
            .join("line");

        const node = svg.append("g")
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
        var t1 = performance.now()
        console.log(t1);
        console.log(t1 - t0 + ' ms');
})




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
