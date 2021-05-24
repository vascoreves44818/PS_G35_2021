'use strict'
let express = require('express');
let sitemap = require('express-sitemap-html')
const bodyParser = require('body-parser')



let server;
const routes = require('./lib/routes/routes.js')


function init(done) {
        let app = express();

        app.set('view engine', 'hbs')
        app.set('views', './lib/views')

        app.use(express.static('public'))
        app.get('/sitemap', sitemap(app))
        app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded

        

        app.use(routes)



        /**
         * Error Handler
         */
        app.use((err, req, resp, next) => {
            if(err.status) resp.status(err.status)
            else (resp.status(500))
            resp.send(JSON.stringify(err, Object.getOwnPropertyNames(err)))
            console.log(err)
        })
        server = app.listen(8080, () => {
            console.log('Listening for HTTP requests on port 8000')
            if (done) done()
        })
}

function close() {
    server.close()
}

module.exports = {init,close}
