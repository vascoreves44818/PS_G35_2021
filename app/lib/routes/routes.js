const phylo_file = require('../repo/phylo_file')
const phylo_db =  require('../repo/phylo_db')
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
router.post('/phyloviz/insertFiles', readFiles)
router.post('/phyloviz/insertDatabasefiles',readDatabaseFiles)

function firstPage(req, res, next) {
    res.redirect('/phyloviz/home');
  }

function home(req, res, next) {
    res.render('home')
}

function readFiles(req,res,next){
    const data = req.body;
    const datasetname = data.datasetname
    const tree = data.tree;
    const profileData = data.profileData;
    const auxiliaryData = data.auxiliaryData;
    
    phylo_file
        .createTables(profileData,auxiliaryData)
        .then(tableElements => {
            phylo_file
                .getJson(tree,datasetname,tableElements)
                .then(treeInfo => {
                    fileInfo = { 
                        json: JSON.stringify(treeInfo),
                    }
                    res.end(JSON.stringify('File read with success!'));
                })
        })
        .catch(err =>{
            res.status = 500;
            res.end(err)
        })
         
}


function readDatabaseFiles(req,res,next){
    const data = req.body.dbFile;
    phylo_db.getJson(data)
        .then(dbData => {
            fileInfo = { 
                json: JSON.stringify(dbData)
            }
            res.end(JSON.stringify('File read with success!'));
        })
        .catch(err =>{
            res.status = 500;
            res.end(err)
        }) 
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


