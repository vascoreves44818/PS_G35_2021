window.onload = setup

let selectedFile;
const reader = new FileReader();
//var qs = require('querystring')

function setup(){

    //const inputElement = document.getElementById("formFile");
    //inputElement.addEventListener("change", handleFiles, false);

    const newickButton = document.getElementById("newickButton");
    const nexusButton = document.getElementById("nexusButton");
    newickButton.addEventListener("click", handleTreeInput);
    nexusButton.addEventListener("click", handleTreeInput);
    
}

function handleFiles() {
    const fileList = this.files; /* now you can work with the file list */
    selectedFile = this.files[0];
    if(selectedFile) readFile(selectedFile)

}

function handleTreeInput(){
    const tree = document.getElementsById("inputTree")
    
}


function readFile(file) {
    const loc = "http://localhost:8080/phyloviz/visualization/"

    let type = 'Newick';
    reader.addEventListener('load', (event) => {
        let tree = {'tree' :  event.target.result};
        if(tree.tree.includes('BEGIN')) type = 'Nexus';

        let path = loc +type;
        fetch(path, 
            {
                method: 'POST',
                headers: {'Content-Type':'application/x-www-form-urlencoded'}
                //body: qs.stringify(tree)
            })
              .then(response => {
                if(res.status != 200) alertMsg(res.statusText)
                console.log( response.json())
            }).catch(err => console.log(err));
    });
    reader.readAsText(file);

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