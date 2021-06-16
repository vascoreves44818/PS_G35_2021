window.onload = setup
let form;
function setup(){
  form = document.getElementById('formInputFile')
  form.addEventListener('submit', logSubmit);
}

function logSubmit(event){
  event.preventDefault();
  const loc = "http://localhost:8080/phyloviz/visualization"

  let doc = document.getElementById('inputFile');
  let selectedFiles = doc.files;
  if(!selectedFiles || selectedFiles.length==0){
    alert('No file inserted!')
    return
  }

  readUploadedFileAsText(selectedFiles[0])
    .then(data => {
            fetch(loc, {
              method: "POST",
              body: JSON.stringify({tree: data}),
              headers: {
                "Content-Type": "application/json"
              }
            })
            .then(res =>{
              if(res.status == 200)
                form.submit();
              else
                alert('Couldn\'t read file with success.')
            })
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

