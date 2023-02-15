const express = require('express');
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
// --------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------
app.engine('.html', require('ejs').__express);
app.set('views', __dirname + '/views');
// app.set('nav', __dirname + '/views/navbar.html');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'js')));
app.set('view engine', 'html');
app.use(bodyParser.urlencoded({ extended: true }));

// --------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------
// Session 
const oneDay = 1000 * 60 * 60 * 24; // creating 24 hours from milliseconds
//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));
// cookie parser middleware
app.use(cookieParser());

// --------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------
var session;
var user_data = [];
var currentPage = 'Home';

// Connect to database connection
var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'NOMS'
});

// --------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------
app.get('/', function(req, res, next){
    // res.render('login');
    session=req.session;
    if(session.userid){
        // res.send("Welcome User <a href=\'/logout'>click to logout</a>");
        res.redirect('home');
        currentPage = 'Home';
    }else{
        res.render('login');
        currentPage = 'Login';
    }
});

// User Home page redirect
app.get('/home', function(req, res, next){
    // res.render('home');
    currentPage = 'Home';
    session=req.session;
    if(session.userid){
        // res.send("Welcome User <a href=\'/logout'>click to logout</a>");
        res.render('home');
        currentPage = 'Home';
    }else{
        // res.redirect('/');
        res.render('home');
    }
});

// User Internet page redirect
app.get('/internet', function(req, res, next){
    currentPage = 'Internet';
    session=req.session;
    if(session.userid){
        // res.send("Welcome User <a href=\'/logout'>click to logout</a>");
        res.render('internet');
    }else{
        // res.redirect('/');
        res.render('internet');
    }
});

// Handling request for Login
// var jsonParser = bodyParser.json();
app.post('/verifyLogin', function(req, res){
    console.log(req.body);
    // res.send(req.body);    // echo the result back

    // connection.connect();
    connection.query(`SELECT * FROM Subscriber 
                            JOIN Equipment ON Equipment.SubscriberId=Subscriber.Id 
                            JOIN PersonalInfo ON Subscriber.PersonalInfoId=PersonalInfo.Id 
                            JOIN Address on Address.Id=PersonalInfo.AddressId 
                        WHERE PortalLogin=? AND PortalPassword=?`, [req.body.username, req.body.password], 
        function (error, results, fields) {
            if (error){
                console.log("user not found");
            }else{
                console.log(results.length);
                user_data = results;
                if(results.length >0){
                    if(user_data[0].PortalLogin === req.body.username && user_data[0].PortalPassword === req.body.password){
                        session=req.session;
                        session.userid=req.body.username;
                        console.log(req.session);
                    }
                }
                // console.log('The solution is: ', results[0]);
                res.send({message: "From Node Login", success: results.length});
            }
        }
    );
    // connection.end();
});


app.get('/logout',(req,res) => {
    req.session.destroy();
    res.redirect('/');
});

app.get('/navbar', function(req, res, next){
    res.render('navbar', {current_page: currentPage});
});

app.get('/footer', function(req, res, next){
    res.render('footer');
});

// --------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------
var server = app.listen(3000, function () {
    var host = 'localhost';
    var port = server.address().port;
    console.log('listening on http://'+host+':'+port+'/');
});