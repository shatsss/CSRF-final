var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('./db');
var csrf = require('csurf');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser')

var Tokens = require('csrf');
var token = Tokens();
var secret = token.secretSync();
var csrfToken = "aaa";
// Configure the local strategy for use by Passport.
//
// The local strategy require a `verify` function which receives the credentials
// (`username` and `password`) submitted by the user.  The function must verify
// that the password is correct and then invoke `cb` with a user object, which
// will be set at `req.user` in route handlers after authentication.
passport.use(new Strategy(
    function (username, password, cb) {
        db.users.findByUsername(username, function (err, user) {
            if (err) {
                return cb(err);
            }
            if (!user) {
                return cb(null, false);
            }
            if (user.password != password) {
                return cb(null, false);
            }
            return cb(null, user);
        });
    }));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  The
// typical implementation of this is as simple as supplying the user ID when
// serializing, and querying the user record by ID from the database when
// deserializing.
passport.serializeUser(function (user, cb) {
    cb(null, user.id);
});

passport.deserializeUser(function (id, cb) {
    db.users.findById(id, function (err, user) {
        if (err) {
            return cb(err);
        }
        cb(null, user);
    });
});


// Create a new Express application.
var app = express();
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded());
// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(require('express-session')({secret: 'keyboard cat', resave: false, saveUninitialized: false}));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Define routes.
app.get('/',
    function (req, res) {
        res.render('home', {user: req.user});
    });

app.get('/login',
    function (req, res) {
        res.render('login');
    });

app.post('/login',
    passport.authenticate('local', {failureRedirect: '/login'}),
    function (req, res) {
        res.redirect('/');
    });
app.get('/register',
    function (req, res) {
        res.render('register');
    });
app.post('/register',
    function (req, res) {
        var userName = req.body.username;
        var password = req.body.password;

        var Tokens = require('csrf');
        var token = Tokens();
        var secret = token.secretSync();
        var csrfToken = token.create(secret);
        db.users.addUser(userName, password, csrfToken);
        res.redirect('/login');
    });

app.get('/logout',
    function (req, res) {
        req.logout();
        res.redirect('/');
    });

app.get('/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        res.render('profile', {user: req.user});
    });
app.get('/transfer',
    require('connect-ensure-login').ensureLoggedIn(),
    function (req, res) {
        res.render('transferring', {csrfSecret: req.user.csrfSecret});
    });

app.post('/transfer', function (req, res) {
    // console.log(req.body._csrf);
    // var csrft = req.body._csrf;
    var bodyStr = '';
    req.on("data", function (chunk) {
        bodyStr += chunk.toString();
        var csrft = bodyStr.split("\r\n")[0].split("=")[1]
         if (req.user.csrfSecret === csrft) {
             console.log(chunk.toString().split("\r\n")[1]);
             console.log(chunk.toString().split("\r\n")[2]);
         }
    });
});


app.listen(3000);
