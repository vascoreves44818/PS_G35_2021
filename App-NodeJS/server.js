'use strict'
let express = require('express');
let sitemap = require('express-sitemap-html')
const bodyParser = require('body-parser')
const formData = require("express-form-data");
const os = require("os");

const options = {
    uploadDir: os.tmpdir(),
    autoClean: true
  };


let server;
const routes = require('./lib/routes/routes.js')


function init(done) {
        let app = express();

        app.set('view engine', 'hbs')
        app.set('views', './lib/views')

        app.use(express.static('public'))
        app.get('/sitemap', sitemap(app))
        app.use(bodyParser.json())
        //app.use(bodyParser.text());
        app.use(bodyParser.urlencoded({ extended: false })) // parse application/x-www-form-urlencoded

        // parse data with connect-multiparty. 
        app.use(formData.parse(options));
        // delete from the request all empty files (size == 0)
        app.use(formData.format());
        // change the file objects to fs.ReadStream 
        app.use(formData.stream());
        // union the body and the files
        app.use(formData.union());

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
