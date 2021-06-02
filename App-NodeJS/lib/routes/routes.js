const phylo_file = require('../repo/phylo_file').init()
const parser = require('./../parsing/parser')

const Router = require('express').Router
const router = Router()

module.exports = router

//Home Page
router.get('/phyloviz/home', home)
router.get('/phyloviz/visualization', forceDirectLayout)

function home(req, res, next) {
    res.render('home')
}

function forceDirectLayout(req, res, next) {
    const tree = req.query.tree
    
    const json = phylo_file.readInputText(tree)
    const renderDocs = parser.parse(json)
    var toRet = { 
        tree: JSON.stringify(renderDocs)
    }
    res.render('visualization',toRet)
}

