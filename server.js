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
var subId = "";

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
    var user_info = {};
    // connection.connect();
    connection.query(`SELECT * FROM Subscriber 
                JOIN Equipment ON Equipment.SubscriberId=Subscriber.Id 
                JOIN PersonalInfo ON Subscriber.PersonalInfoId=PersonalInfo.Id 
                JOIN Address on Address.Id=PersonalInfo.AddressId 
            WHERE PortalLogin=? AND PortalPassword=?`, ["test_user", "test123"], 
        function (error, results, fields) {
            if (error){
                console.log("user not found");
            }else{
                // console.log(results.length);
                user_data = results;
                user_info = results[0];
                if(results.length >0){
                    if(user_data[0].PortalLogin === req.body.username && user_data[0].PortalPassword === req.body.password){
                        session=req.session;
                        session.userid=req.body.username;
                        // console.log(req.session);
                    }
                }
                // console.log('The solution is: ', user_info);
                subId = user_info.SubId;
                // console.log("RJ-TEST HOME:"+ subId)
                if(session.userid){
                    // res.send("Welcome User <a href=\'/logout'>click to logout</a>");
                    res.render('home', {user: user_info});
                    currentPage = 'Home';
                }else{
                    // res.redirect('/');
                    res.render('home', {user: user_info});
                }
            }
        }
    );
});

var return_obj = {};
// User Internet page redirect
app.get('/internet', function(req, res, next){
    currentPage = 'Internet';
    session=req.session;
    console.log("RJ-TEST Internet: "+ subId)
    var identifier_list = [];
    if(!session.userid){
        (async() =>{
            try{
                connection.query(`SELECT Equipment.Identifier FROM Subscriber 
                                JOIN Equipment ON Equipment.SubscriberId=Subscriber.Id 
                            WHERE SubId=?`, ["00624767"], 
                    function (error, results, fields) {
                        if (error){
                            console.log("user not found");
                        }else{
                            // console.log(results.length);
                            user_data = results;
                            user_info = results[0];
                            user_data.forEach(element => {
                                identifier_list.push(element.Identifier);
                            });
                            return_obj.identifier_list = identifier_list;
                        }
                        var daily_download = {};
                        var daily_upload = {};
                        // return_obj.daily_download = callbackFunction(identifier_list).then();
                        connection.query(`SELECT Equipment.Identifier, sum(SidHistory.inoctets_delta) as daily_upload, sum(SidHistory.outoctets_delta) as daily_download FROM Subscriber 
                                        JOIN Equipment ON Equipment.SubscriberId=Subscriber.Id 
                                        JOIN SidHistory ON Equipment.Identifier=SidHistory.mac 
                                        WHERE SubId=? GROUP BY Equipment.Identifier`, ["00624767"], 
                                function (error, results, fields) {
                                    if (error){
                                        console.log("user not found");
                                    }else{
                                        results.forEach(element => {
                                            daily_download[element.Identifier] = element.daily_download;
                                            daily_upload[element.Identifier] = element.daily_upload;
                                        });
                                        console.log('The solution in SidHistory: ', daily_download);
                                    }
                                    return_obj.daily_download = daily_download;
                                    return_obj.daily_upload = daily_upload;
                                    
                                    console.log('The solution is T: ', return_obj);
                                    res.render('internet', {user_data: return_obj});   
                                }
                        );
                    }
                )
            }catch(err){
                console.log("Error while getting list of Identifiers: "+ err)
            }
        })();
    }else{
        res.redirect('/');
    }
});

async function callbackFunction(identifier_list){
    var usage_array_1 = [];
    connection.query(`SELECT Equipment.Identifier, SidHistory.inoctets_delta as daily_download, SidHistory.outoctets_delta as daily_upload FROM Subscriber 
                JOIN Equipment ON Equipment.SubscriberId=Subscriber.Id 
                JOIN SidHistory ON Equipment.Identifier=SidHistory.mac 
                    WHERE SubId=?`, ["00624767"], 
            function (error, results, fields) {
                if (error){
                    console.log("user not found");
                }else{
                    results.forEach(element => {
                        usage_array_1.push(element.daily_download);
                    });
                    console.log('The solution in SidHistory: ', usage_array_1);
                }
                
            }
        
    );
    return usage_array_1;
}
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

function getSubData(username, password){
    var user_info = {};
    connection.query(`SELECT * FROM Subscriber 
                            JOIN Equipment ON Equipment.SubscriberId=Subscriber.Id 
                            JOIN PersonalInfo ON Subscriber.PersonalInfoId=PersonalInfo.Id 
                            JOIN Address on Address.Id=PersonalInfo.AddressId 
                        WHERE PortalLogin=? AND PortalPassword=?`, [username, password], 
        function (error, results, fields) {
            if (error){
                console.log("user not found");
            }else{
                console.log(results.length);
                user_data = results;
                user_info = results[0];
                return user_info;
                // if(results.length >0){
                //     if(user_data[0].PortalLogin === req.body.username && user_data[0].PortalPassword === req.body.password){
                //         session=req.session;
                //         session.userid=req.body.username;
                //         console.log(req.session);
                //     }
                // }
                // console.log('The solution is: ', results[0]);
                // res.send({message: "From Node Login", success: results.length});
            }
        }
    );
}