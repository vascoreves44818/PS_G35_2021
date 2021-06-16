const phylo_file = require('../repo/phylo_file').init()
const parser = require('./../parsing/parser')
const qs = require('querystring')

const Router = require('express').Router
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
    const tree = data.tree
    let treeType = 'Newickk'
    if(tree.includes('BEGIN')){
        treeType = 'Nexus'
    }

    let json;
    if(treeType == 'Newick')
        json = phylo_file.readNewickTree(tree)
    else 
        json = phylo_file.readNexusTree(tree)

    const renderDocs = parser.parse(json)

    fileInfo = { 
        tree: JSON.stringify(renderDocs) 
    }
    res.end(JSON.stringify('File read with success!'));
       
}

function visualizationFromFile(req, res, next) {
    res.render('visualization',fileInfo)    
}

function visualizationFromTree(req, res, next) {
    const tree = req.query.tree
    let treeType = 'Newick'

    if(tree.includes('BEGIN')){
        treeType = 'Nexus'
    }

    let json;
    if(treeType == 'Newick')
        json = phylo_file.readNewickTree(tree)
    else 
        json = phylo_file.readNexusTree(tree)

    const renderDocs = parser.parse(json)
    var toRet = { 
        tree: JSON.stringify(renderDocs)
    }
    res.render('visualization',toRet)
}



