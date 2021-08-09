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

The main module is the visualization module, where the [**Force Direct Layout file**]() is the file responsible of building the visualization and all the features involved.

### Data type
This module receives the information in JSON format with all the information, either from saved datasets or new datasets. The JSON object received must contain the ```links``` and ```nodes``` field.

Each **node** object contains the following properties:

![image](https://user-images.githubusercontent.com/47890762/128728971-f8a98711-667e-4392-bae3-4dac4977a435.png)

The ```key``` property is the node identifier, ```isNodeLeaf``` is a boolean that represents if it's a tree leaf and ```profile``` and ```isolate```, that are optional, and represent an array with the profile and isolated data.

![image](https://user-images.githubusercontent.com/47890762/128731642-b802962d-adcb-4e95-8e87-614876d63687.png)

Each **link** object contains the following properties:

![image](https://user-images.githubusercontent.com/47890762/128734041-c14e3b8e-150c-4aed-b3c0-900ddef3ccf1.png)

```Source``` and ```Target``` represent the keys of the nodes the link is connecting, and also the ```value``` property for each link.




## Contact
- Vasco Revés, a44818@alunos.isel.pt
