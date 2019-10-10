'use strict';

// Let's start by declaring our dependencies:
const express = require("express");
const bodyParser = require("body-parser");
// For tidiness' sake, we have our routes in a separate file/module; let's make them accessible here so that our server can use them:
const apiRoutes = require("./routes/api.js");
// We'll be needing a database to store all of the books' information in:
const MongoClient = require("mongodb").MongoClient;
// We'll use Helmet.js to help secure our express app:
const helmet = require("helmet");


// Let's instantiate our Express.js server...
const app = express();
// ... and tell it to use the body-parser middleware to that we can easily access the content of the submitted forms in req.body:
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: true }) );

            /*
            USER STORY 1: Nothing from my website will be cached in my client as a security measure.
            USER STORY 2: I will see that the site is powered by 'PHP 4.2.0' even though it isn't as a security measure.
            */

// We'll also tell Express to use helmet:
    // N.B. Helmet will by default load with these modules active: dnsPrefetchControl (control browser DNS prefetching), frameguard (prevent clickjacking), 
    // hidePoweredBy (remove X-Powered-By header), hsts (HTTP Strict Transport Security), ieNoOpen (X-Download-Options for IE8+), noSniff (stop clients from
    // sniffing MIME type), and xssFilter (small XSS protections).
// By default, noCache is not active and hidePoweredBy simply removes the X-powered-by header. We'll enable the former and make the latter "fake" x-powered-by.
// We'll also need to disable the frameguard module (which loads by default) in order to be able to embed this project (e.g. on my website):
app.use( helmet({
  noCache: true,
  hidePoweredBy: {
    setTo: "PHP 4.2.0"
  },
  frameguard: false
}));


// Dependencies for freeCodeCamp's test suite...
const cors = require('cors');
app.use(cors({origin: '*'}));
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');
// ... END of freeCodeCamp test-suite needs.



// With all of the above sorted out, let's tell our Express server where we want it to store our static files (e.g. CSS, JS, images):
app.use('/public', express.static(process.cwd() + '/public'));

// We'll also define our homepage:
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });




// To keep a record of the books in our library and their comments, let's connect to our database:
MongoClient.connect(
  process.env.MONGO_DB,
  { useNewUrlParser: true },
  function (err, database) {
    // We'll first handle any errors that might arise during the async/remote event:
    if (err) return console.log("Error connecting to database:", err);
    // If there are no errors, we should be connected and can move on to our different route handlers...
    
    
    // ... we'll call our routes (and freeCodeCamp's testing routes as well) so that the contents of these two modules can be called from here:

    // The FCC routes...
    fccTestingRoutes(app);
    // ... and our own routes:
    apiRoutes(app, database);


    // With our core routes laid out, we can write one last route handler, which will be our catch-all 404 middleware:
    app.use(function(req, res, next) {
      res.status(404)
        .sendFile(process.cwd() + "/views/404.html");
    });


    // Finally, we make sure that our APP is "alive" by ensuring that it is actively listening for incoming requests:
    app.listen(process.env.PORT, function () {
      // And we'll make it easy to see if the app is up and running:
      console.log("Listening on port " + process.env.PORT);

      // To activate freeCodeCamp's Mocha/Chai testing suite, we need to set the .env variable NODE_ENV=test:
      if(process.env.NODE_ENV==='test') {
        console.log('Running Tests...');
        setTimeout(function () {
          try {
            runner.run();
          } catch(e) {
            let error = e;
              console.log('Tests are not valid:');
              console.log(error);
          }
        }, 1500);
      }  // END of code for freeCodeCamp's testing suite:

    });  // END of app.listen()
  
  });  // END of MongoClient.connect() and its callback function



// For freeCodeCamp's test-suite...
module.exports = app;
// ... END of FCC test suite.