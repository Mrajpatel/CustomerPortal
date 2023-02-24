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
    console.log("RJ-TEST Internet: "+ subId);
    var identifier_list = [];
    if(!session.userid || subId.trim() !== ""){
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
                            console.log('The solution is T: ', return_obj);
                            res.render('internet', {user_data: return_obj}); 
                        }
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

// getUsageData
app.post('/getUsageData', function(req, res) {
    var return_data = {}
    var daily_download = "";
    var daily_upload = "";
    var daily_total = "";
    var this_month_download = "";
    var this_month_upload = "";
    var this_month_total = "";
    var mac = req.body.identifier;

    connection.query(`SELECT 
                        Equipment.Identifier, 
                        sum(SidHistory.inoctets_delta) as daily_upload, sum(SidHistory.outoctets_delta) as daily_download, 
                        (sum(SidHistory.inoctets_delta) + sum(SidHistory.outoctets_delta)) as daily_total,
                        sum(SidHistoryDaily.inoctets) as this_month_upload, sum(SidHistoryDaily.outoctets) as this_month_download, 
                        (sum(SidHistoryDaily.inoctets) + sum(SidHistoryDaily.outoctets)) as this_month_total
                    FROM Subscriber 
                    JOIN Equipment ON Equipment.SubscriberId=Subscriber.Id 
                    JOIN SidHistory ON Equipment.Identifier=SidHistory.mac 
                    JOIN SidHistoryDaily on SidHistoryDaily.mac=Equipment.Identifier
                    WHERE Equipment.Identifier=? GROUP BY Equipment.Identifier`, [mac], 
            function (error, results, fields) {
                if (error){
                    console.log("user not found");
                }else{
                    results.forEach(element => {
                        daily_download = Math.round((element.daily_download/1000000000 + Number.EPSILON) * 100) / 100;
                        daily_upload = Math.round((element.daily_upload/1000000000 + Number.EPSILON) * 100) / 100;
                        daily_total = Math.round((element.daily_total/1000000000 + Number.EPSILON) * 100) / 100;
                        this_month_download = Math.round((element.this_month_download/1000000000 + Number.EPSILON) * 100) / 100;
                        this_month_upload = Math.round((element.this_month_upload/1000000000 + Number.EPSILON) * 100) / 100;
                        this_month_total = Math.round((element.this_month_total/1000000000 + Number.EPSILON) * 100) / 100;
                    });
                    return_data.identifier = mac;
                    return_data.daily_download = daily_download === "" ? "0" : daily_download;
                    return_data.daily_upload = daily_upload === "" ? "0" : daily_upload;
                    return_data.daily_total = daily_total === "" ? "0" : daily_total;
                    return_data.this_month_download = this_month_download === "" ? "0" : this_month_download;
                    return_data.this_month_upload = this_month_upload === "" ? "0" : this_month_upload;
                    return_data.this_month_total = this_month_total === "" ? "0" : this_month_total;
                    
                    console.log('The Data from getDataUsage: ', return_data);
                    res.send({user_data: return_data});   
                }
                
            }
    );
});

// getMonthlyUsageData
app.post('/getMonthlyUsageData', function(req, res) {
    var return_data = {}
    var download = [];
    var upload = [];
    var total = [];
    var month = [];
    var mac = req.body.identifier;

    connection.query(`SELECT inoctets as upload, outoctets as download, mac, time_id, Month(time_id) as month from SidHistoryMonthly 
                        WHERE mac=? 
                        ORDER BY time_id desc limit 12`, [mac], 
            function (error, results, fields) {
                if (error){
                    console.log("user not found");
                }else{
                    results.forEach(element => {
                        // console.log(element);
                        download.push(Math.round((element.download/1000000000 + Number.EPSILON) * 100) / 100);
                        upload.push(Math.round((element.upload/1000000000 + Number.EPSILON) * 100) / 100);
                        total.push(Math.round(((element.download+element.upload)/1000000000 + Number.EPSILON) * 100) / 100);
                        month.push(element.month)
                        
                        // var download = Math.round((element.download/1000000000 + Number.EPSILON) * 100) / 100;
                        // var upload = Math.round((element.upload/1000000000 + Number.EPSILON) * 100) / 100;
                        // var total = Math.round(((element.download+element.upload)/1000000000 + Number.EPSILON) * 100) / 100;
                        // return_data[element.month] = {"download": download, "upload": upload, "total": total};
                    });

                    return_data.upload = upload;
                    return_data.download = download;
                    return_data.total = total;
                    return_data.month = month;
                    // return_data.daily_download = daily_download === "" ? "0" : daily_download;
                    // return_data.daily_upload = daily_upload === "" ? "0" : daily_upload;
                    // return_data.daily_total = daily_total === "" ? "0" : daily_total;
                    
                    console.log('The Data from getDataUsage: ', return_data);
                    res.send({user_data: return_data});   
                }
                
            }
    );
});

// Handling request for Login
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