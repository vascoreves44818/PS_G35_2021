window.onload = setup 

function setup(){
    var navTab = document.getElementById('graphicTab')
    navTab.style.visibility = 'visible';
    
    var script = document.getElementById('buildTables');
    var tableData = script.getAttribute('tables')
    var profileData = script.getAttribute('profileData')
    var auxiliaryData = script.getAttribute('auxiliarData')
    
    
    if(profileData)
        buildProfileTable(profileData);
    if(auxiliaryData)
        buildAuxTable(auxiliaryData);

}

function buildProfileTable(data){
    var profileTable = document.getElementById('profileTable')
    var table = document.createElement('table')
    var tableHead;
    data.forEach(row => {
        var items = row.split('\'');
        if(!tableHead){
            tableHead = document.createElement('thead').appendChild(document.createElement('tr').setAttribute('class','table-dark'))
            items.forEach(element => {
                var tableRow =document.createElement('th').innerHTML=element;
                tableHead.appendChild(tableRow)
            })
            table.appendChild(tableHead);
        }
    });
    profileTable.appendChild(table)
    

}

function buildAuxTable(data){
    var auxiliaryTable = document.getElementById('auxTable')  


}