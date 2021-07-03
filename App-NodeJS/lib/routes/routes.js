const phylo_file = require('../repo/phylo_file')
const parser = require('./../parsing/parser')
const qs = require('querystring')

const Router = require('express').Router
const { table } = require('console')
const router = Router()
var fileInfo;

module.exports = router

router.get('/', firstPage);
router.get('/phyloviz/home', home)
router.get('/phyloviz/visualization', visualizationFromTree)
router.get('/phyloviz/visualization/file', visualizationFromFile)
router.post('/phyloviz/visualization', getFileFromPost)

function firstPage(req, res, next) {
    res.redirect('/phyloviz/home');
  }

function home(req, res, next) {
    res.render('home')
}

function getFileFromPost(req,res,next){
    const data = req.body;
    const datasetname = data.datasetname
    const tree = data.tree;
    const profileData = data.profileData;
    const auxiliaryData = data.auxiliaryData;
    

    phylo_file.createTables(profileData,auxiliaryData)
        .then(tableElements => {
            phylo_file.getJson(tree,datasetname,tableElements)
                .then(treeInfo => {
  //                  treeInfo.profileData = tableElements[0];
//                    treeInfo.isolateData = tableElements[1];
                    fileInfo = { 
                        json: JSON.stringify(treeInfo),
                    }
                    res.end(JSON.stringify('File read with success!'));
                })
        })
        .catch(next)
         
}

function visualizationFromFile(req, res, next) {
    res.render('visualization',fileInfo)    
}

function visualizationFromTree(req, res, next) {
    const tree = req.query.tree
    phylo_file.getJson(tree)
        .then(treeInfo =>{
            var toRet = { 
                json: JSON.stringify(treeInfo) 
            }
            res.render('visualization',toRet)
        })
        .catch(next)
   
    
    
}



