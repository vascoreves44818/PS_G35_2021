# Force Direct Visualization for Phylogenetic Trees
**Force Direct Visualization for Phylogenetic Trees** is a cross-platform desktop app, build on [Electron](https://www.electronjs.org/), for phylogeneric tree visualization. Also available to be used in applications such as PHYLOVIZ.
This project focuses on a non static visualization of phylogenetic trees, Force Directed Layout, build using [D3.js](https://d3js.org/).
The application is a modular soluction build using Javascript, Handlebars, HTML and CSS.

 - #### [DOCUMENTATION]
 - #### [RUN THE APPLICATION]

## Force Directed Layout 
**Force direct layout**, is a algorithm for graphic visualization in the browser. This algorithm is based on a physical model, simulating physical forces among the set of edges and nodes,based on their relative positions and using this forces to simulate movement. Thenodes are represented by points that repel each other like magnets resulting in as few crossingedges as possible. This algorithm receives as input a phylogenetic tree in either Newick or nexus format and the profile and isolated data. 

![image](https://user-images.githubusercontent.com/47890762/128645683-5161eb4f-2203-44fa-8344-e812a9f73fb7.png)

![image](https://user-images.githubusercontent.com/47890762/128645663-7fc283dc-300c-483a-908c-caa1f92b6137.png)

### Features
- Collapse and expand;
- Pie-Chart Graphics;
- Node and Link Labels;
- Tree filters;
- Statistics;
- Save and load state;

## DOCUMENTATION 
The project was developed as a Node.js application, developed in modules then exported to [Electron](https://www.electronjs.org/).

The visualization module is the main module of the application, where the [**Force Direct Layout file**]() is the file responsible of building the visualization and all the features involved.

### Data type
This module receives the information in JSON format with all the information, either from saved datasets or new datasets. The JSON object received must contain the ```links``` and ```nodes``` field.

Each **node** object contains the following properties:

![image](https://user-images.githubusercontent.com/47890762/128728971-f8a98711-667e-4392-bae3-4dac4977a435.png)

The ```key``` property is the node identifier, ```isNodeLeaf``` is a boolean that represents if it's a tree leaf and ```profile``` and ```isolate```, that are optional, and represent an array with the profile and isolated data.

![image](https://user-images.githubusercontent.com/47890762/128731642-b802962d-adcb-4e95-8e87-614876d63687.png)

Each **link** object contains the following properties:

![image](https://user-images.githubusercontent.com/47890762/128734041-c14e3b8e-150c-4aed-b3c0-900ddef3ccf1.png)

```Source``` and ```Target``` represent the keys of the nodes the link is connecting, and also the ```value``` property for each link.

### Start Force Direct Layout

#### setup() 
 
This method starts the visualization. It starts by reading the JSON data given and calling the following methods to start the layout.

#### init() 
 
 This method initializes the svg and it's zoom and viewbox attributes, as well as the html ``` <g> ``` element to draw the tree.
 
#### start()

The start method draws all the html elements, links, nodes, labels, colors, etc.

For the nodes it will add the event listeners, with the D3.js ```on(type[, listener[, capture]])``` method:

For moving the nodes, calling the functions:

- **dragstarted()**
- **dragged()**
- **dragended()**

For collapsing the nodes on *click* calling the functions:
- **click()**

It also checks if the information given, is from a saved dataset, if so, sets the graphic filters to the saved info calling the method ```startDBfilters```.

#### startDBfilters()

````startDBfilters()````

This method checks if the stored tree info has stored filters like, node and link labels, node colors, link stroke and graphic position.

#### startSimulation()

````startSimulation()````

This method uses the [D3.js force library](https://github.com/d3/d3-force) to start the simulation, it defines all the forces envolved in the graphic, the link force, charge force, center force and collide force.

### Graphic Labels

#### showLabels(className)

Sets visibility of elements with class className to 'visible' if node or link is not collapsed.

#### hideLabels(className)

Sets visibility of all elements with class className to 'hidden'.

#### changeNodeLabelSize()

Sets the node font size to the value from range value input.

Saves the label size to the json data. 

#### changeLinkLabelSize()

Sets the link font size to the value from range value input.

Saves the label size to the json data. 

#### checker(checked)

If checked shows node labels, if not hides nodes labels.

#### checkerLinks(checked)

If checked shows link labels, if not hides link labels.

### NODE AND LINK COLOR & SIZE

#### changeNodeSize()

Checks for node scale factor or size key values from inputs, changes all node sizes.

#### changeLinkStroke()

Changes link stroke to value from range value input.

#### changeLinkSize()

Changes link size by creating new linkForce distance and set value to the simulation.

#### nodeSize(d)

Given a node object, returns node size. Checks if log scale is checked.

#### linkSize(l)

Given a link object, returns link size. Checks if log scale is checked.

#### color(node,value)

If no value returns node color for collapsed nodes, for leaf nodes and normal nodes.
If value is defined, value is a function returns color according to filter selected.

#### changeColorByProfile(e,k)

Defines the 'value' function with the colors scale by profile key. Calls  ```color(node, value)``` with the value set.
'e' is the event from the event listenner and 'k' is the profile color key.

#### changeColorByIsolate(e,k)

Defines 'value' function with the colors scale by isolate key. Calls  ```color(node, value)``` function with the value set.
'e' is the event from the event listenner and 'k' is the profile color key.

### GRAPHIC FORCES

#### changeChargeForce()

Change simulation's charge force to value from range value input.
Saves new value to json data object.

#### changeColideForce()

Change simulation's collide force to value from range value input.
Saves new value to json data object.

#### resetForces()

Reset simulation's forces to default values.

### GRAPHIC MOVEMENT

#### click(event, node)

Called on '#click#' to collapse or expand the node clicked.
```event``` can be null. 

#### ticked()

Called on '#tick#' to move the html elements, links, nodes and labels.

### GRAPHIC BUTTONS

#### pauseSimulation()

Pauses simulation and doesn't allow nodes to be dragged. 

#### searchGraphByNode()

Gets value to search from input text. Scales the graph to zoom on the node with key equal to the value given.

### Save state

#### save()

Saves JSON file with all info, directly to the user's machine.

## Contact
- Vasco Revés, a44818@alunos.isel.pt
