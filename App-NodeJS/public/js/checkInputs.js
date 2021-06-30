window.onload = setup
let form = document.getElementById('formInputFile');
let data;
let profileData;
let auxiliaryData;

function setup(){
  form.addEventListener('submit', logSubmit);
}

function logSubmit(event){
  event.preventDefault();
  form = document.getElementById('formInputFile')
  const loc = "http://localhost:8080/phyloviz/visualization"

  let doc1 = document.getElementById('inputFile');
  let doc2 = document.getElementById('inputFile2');
  let doc3 = document.getElementById('inputFile3');
  let datasetname = document.getElementById('inputDatasetName').value;

  if(!datasetname){
    alert('Insert dataset name!')
    return
  }
  let treeFiles = doc1.files;
  let profile = doc2.files;
  let auxiliary = doc3.files;

  if(!treeFiles || treeFiles.length==0){
    alert('Insert Tree File!')
    return
  }else{
    data = readUploadedFileAsText(treeFiles[0])
  }
  if(profile.length!=0){
    profileData = readUploadedFileAsText(profile[0])
  }
  if(auxiliary.length!=0){
    auxiliaryData = readUploadedFileAsText(auxiliary[0])
  }

  Promise.all([data,profileData,auxiliaryData])
    .then((values) => {
        const XHR = new XMLHttpRequest();
        const FD  = new FormData();
        
        FD.append('datasetname', datasetname)
        if(values[0]){
          FD.append('tree', values[0]);
        }
        if(values[1]){
          FD.append('profileData', values[1]);
        }
        if(values[2]){
          FD.append('auxiliaryData', values[2]);
        }
        
        XHR.addEventListener( 'load', function( event ) {
          form.submit();
        } );
        // Define what happens in case of error
        XHR.addEventListener('error', function( event ) {
          alert( 'Oops! Something went wrong.' );
        } );
        // Set up our request
        XHR.open( 'POST', loc );
        // Send our FormData object; HTTP headers are set automatically
        XHR.send( FD );

    })
    .catch(e => { 
      console.log(e.message);
    });

    
}

function readUploadedFileAsText(inputFile){
  const fileReader = new FileReader();
  
  return new Promise((resolve, reject) => {
    fileReader.onerror = () => {
      fileReader.abort();
      reject(new DOMException("Problem parsing input file."));
    };

    fileReader.onload = () => {
      resolve(fileReader.result);
    };
    fileReader.readAsText(inputFile);
  });
};

function validateTreeForm() {
    var tree = document.getElementById("inputTree").value;
    if(tree=="" || !tree){
      alert("Tree must be inserted");
      return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', function () {
  form.addEventListener('submit', logSubmit);
} );


/*
function logSubmit(event){
  let doc = document.getElementById('inputFile');
  let selectedFiles = doc.files;
  if(!selectedFiles || selectedFiles.length==0){
    alert('No file inserted!')
    return
  }
  readFile(selectedFiles[0])
}

function readFile(file) {
  const loc = "http://localhost:8080/phyloviz/visualization"
  let filename = file.name
  let data;

  try {
    readUploadedFileAsText(file)
      .then(data => {
        const XHR = new XMLHttpRequest()
        const FD  = new FormData();
        FD.append('tree', data);
        XHR.addEventListener( 'load', function( event ) {
          alert( 'Data sent and response loaded.' );
        } );
        // Define what happens in case of error
        XHR.addEventListener('error', function( event ) {
          alert( 'Oops! Something went wrong.' );
        } );
        // Set up our request
        XHR.open( 'POST', loc );
        // Send our FormData object; HTTP headers are set automatically
        XHR.send( FD );
      })
  } catch (e) {
    alert(e.message);
  }
  
}
*/

