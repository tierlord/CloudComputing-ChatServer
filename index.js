var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var userHandler = require('./userHandler');
var fileHandler = require('./fileHandler');

// This is to serve static files to the client
app.use('/js', express.static('js'));
app.use('/css', express.static('css'));
app.use('/img', express.static('img'));

// A new user will first get to the login page
app.get('/', function(req, res){
  res.sendFile(__dirname + '/login.html');
});

// This is where you enter the chatroom. If the requested username
// is already in use, you will be redirected to the login page
app.get('/chat/*', function(req, res){
  var name = req.params[0];
  if(userHandler.checkUsername(name)){
    userHandler.addUser(name);
    res.sendFile(__dirname + '/index.html');
  } else {
    res.sendFile(__dirname + "/login.html");
  }  
});

// Check if a username is already in use
app.get('/user/*', function(req, res){
  var name = req.params[0];
  console.log("Check user: " + name);
  if(userHandler.checkUsername(name)){
    res.send('free');
  } else {
    res.send('used');
  }
});

// A list of the connected sockets containing touples:
// [socketobject, username]
socketList = [];

io.on('connection', function(socket){
  // A hello event will be fired on connection. Here, the browser tells NodeJS
  // which username belongs to which socket
  socket.on('hello', function(usrnm){
    socketList.push([socket, usrnm]);
  });

  socket.broadcast.emit('enter chat',userHandler.getLastUser());
  broadcastList();

  // On disconnect, the user will be removed from socketList and userList
  socket.on('disconnect', function(){
    for(var i = 0; i < socketList.length; i++){
      if(socket == socketList[i][0]){
        console.log(socketList[i][1] + " disconnected!");
        userHandler.removeUser(socketList[i][1]);
        io.emit('exit chat', socketList[i][1]);
        socketList.splice(i,1);
        broadcastList();
        break;
      }
    }
  });

  // When a client sends a message, it will be broadcasted to all clients
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });

  socket.on('private message', function(msg){
    for(var i = 0; i < socketList.length; i++){
      if(msg.recipient == socketList[i][1]){
        socketList[i][0].emit('private message', msg);
      }
    }
  });
});

// Sends a list of usernames to all clients
function broadcastList(){
  var userList = userHandler.getUsers();
  io.emit('user list', userList);
}

// This is the command to start the server
http.listen(port, function(){
  console.log('listening on *:' + port);
});
