// Alina Elena Aldea-Ionescu - 310194
// Joffrey Schneider - 762380

var express = require("express");
var app = express();
var http = require("http").Server(app);
const fetch = require('node-fetch');
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

var userHandler = require("./userHandler");

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
app.get("/chat/*", function(req, res) {
  var name = req.params[0];
  var valid = /^[0-9a-zA-Z\_]+$/; // Valid character check
  if (userHandler.checkUsername(name) && name.match(valid)) {
    userHandler.addUser(name);
    res.sendFile(__dirname + "/index.html");
  } else {
    res.sendFile(__dirname + "/login.html");
  }
});

// Check if a username is already in use
app.get("/user/*", function(req, res) {
  var name = req.params[0];
  console.log("Check user: " + name);
  if (userHandler.checkUsername(name)) {
    res.send("free");
  } else {
    res.send("used");
  }
});

// A list of the connected sockets containing touples:
// [socketobject, username]
socketList = [];

io.on("connection", function(socket) {
  // A hello event will be fired on connection. Here, the browser tells NodeJS
  // which username belongs to which socket
  socket.on("hello", function(usrnm) {
    socketList.push([socket, usrnm]);
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

// This is the command to start the server
http.listen(port, function() {
  console.log("listening on *:" + port);
});

setTimeout(broadcastList, 10000);
