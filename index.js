// Alina Elena Aldea-Ionescu - 310194
// Joffrey Schneider - 762380

var ibmdb = require("ibm_db");
var express = require("express");
var app = express();
var request = require("request");
var http = require("http").Server(app);
const fetch = require('node-fetch');
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

var dbString = "DATABASE=BLUDB;HOSTNAME=dashdb-txn-sbox-yp-lon02-01.services.eu-gb.bluemix.net;PORT=50001;PROTOCOL=TCPIP;UID=wwz36807;PWD=wb2fttzm+cgl8nwv;Security=SSL;"

var userHandler = require("./userHandler");
var dbHandler = require("./dbhandler");

// This is to serve static files to the client
app.use("/js", express.static("js"));
app.use("/css", express.static("css"));
app.use("/img", express.static("img"));

// A new user will first get to the login page
app.get("/", function(req, res) {
  res.sendFile(__dirname + "/login.html");
});

// This is where you enter the chatroom. If the requested username
// is already in use, you will be redirected to the login page
app.get("/chat/", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

// A list of the connected sockets containing touples:
// [socketobject, username]
socketList = [];

io.on("connection", function(socket) {
  // A hello event will be fired on connection. Here, the browser tells NodeJS
  // which username belongs to which socket
  socket.on("hello", function(usrnm, pw) {
    checkDbAccount(usrnm, pw, socket);
  });

  socket.broadcast.emit("enter chat", userHandler.getLastUser());
  broadcastList();

  // On disconnect, the user will be removed from socketList and userList
  socket.on("disconnect", function() {
    for (var i = 0; i < socketList.length; i++) {
      if (socket == socketList[i][0]) {
        console.log(socketList[i][1] + " disconnected!");
        userHandler.removeUser(socketList[i][1]);
        io.emit("exit chat", socketList[i][1]);
        socketList.splice(i, 1);
        broadcastList();
        break;
      }
    }
  });

  // When a client sends a message, it will be broadcasted to all clients
  socket.on("chat message", function(msg) {
    msg.mood = checkMood(msg);
    // io.emit("chat message", msg);
  });

  socket.on("private message", function(msg) {
    for (var i = 0; i < socketList.length; i++) {
      if (msg.recipient == socketList[i][1]) {
        socketList[i][0].emit("private message", msg);
      }
    }
  });

  socket.on("login", function(loginData){
    checkDbAccount(loginData.username, loginData.userpw, socket);
  });

  socket.on("register", function(userData){
    createDbUser(userData, socket);
  });
});

// Sends a list of usernames to all clients
function broadcastList() {
  var userList = userHandler.getUsers();
  io.emit("user list", userList);
}

function checkMood(msg){
  var url = "https://ccchattone.eu-gb.mybluemix.net/tone";
  var data = JSON.stringify({ texts: [msg.text] });

  fetch(url, {
      method: 'post',
      body:    data,
      headers: {'Content-Type': 'application/json',
                  'mode': 'cors'},
  })
  .then(res => res.json())
  .then(function(json) {
    //msg.mood = JSON.parse(json).mood;
    var mood = json.mood;
    console.log("Mood: " + mood);
    if(mood == "happy") msg.mood = "happy";
    if(mood == "unhappy") msg.mood = "unhappy";
    io.emit('chat message', msg);
  });
}

function getDbUserByName(name, conn){
  ibmdb.open(dbString, function (err,conn) {
    if (err) return console.log(err);
    conn.query("select * from users where username = '" + name + "'", function (err, data) {
      if (err) console.log(err);
      else console.log(data[0].USERNAME);
    });
    conn.close(function () {
      console.log('DB connection closed');
    });
  });
}

function checkDbAccount(name,password,sock){
  ibmdb.open(dbString, function (err,conn) {
    if (err) return console.log(err);
    conn.query("select * from users where username = '" + name + "'", function (err, data) {
      if (err) console.log(err);
      var existing = (data.length != 0);
      if (existing && data[0].USERPW == password){
        sock.emit("login", true, name, password, data[0].PICTURE, existing);
        socketList.push([sock, name]);
        if(userHandler.checkUsername(name)){
          userHandler.addUser(name);
        }        
      } else {
        sock.emit("login", false, name, '', '', existing);
      }
    });
    conn.close(function () {
    });
  });
}

function createDbUser(data, sock){
  ibmdb.open(dbString, function (err,conn) {
    if (err) return console.log(err);
    conn.query("insert into users values ('"+data.username+"', '"+data.userpw+"', ?, '"+data.lastlogin+"');", [data.userpic], function (err, data) {
      if (err){
        console.log(err);
        sock.emit("register", false);
      } else {
        console.log(data);
        sock.emit("register", true);
      }      
    });
    conn.close(function () {
    });
  });
}

// This is the command to start the server
http.listen(port, function() {
  console.log("listening on *:" + port);
  
  var options = {
    "method": "POST",
    "url": "https://gateway.watsonplatform.net/visual-recognition/api/v3/detect_faces?url=https://watson-developer-cloud.github.io/doc-tutorial-downloads/visual-recognition/",
    "headers": {
      "authorization": "ApiKey apikey:7K6tDf8rFWkIMz_pcG5QZcTtKM6donGDTsT1QSKhqcoT",
      "accept": "text/json",
      "cache-control": "no-cache",
    }
  };
  
  var req = http.request(options, function (res) {
    var chunks = [];
  
    res.on("data", function (chunk) {
      chunks.push(chunk);
    });
  
    res.on("end", function () {
      var body = Buffer.concat(chunks);
      console.log(body.toString());
    });
  });
  
  req.end();
});

setInterval(broadcastList, 5000);
