var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var userHandler = require('./userHandler');

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.get('/chat/*', function(req, res){
  var name = req.params[0];
  console.log(name);
  if(userHandler.checkUsername(name)){
    userHandler.addUser(name);
    res.sendFile(__dirname + '/index.html');
  } else {
    res.send("Sorry, username already taken!");
  }  
});

socketList = [];

io.on('connection', function(socket){
  socket.on('hello', function(usrnm){
    socketList.push([socket, usrnm]);
  });
  socket.on('disconnect', function(){
    for(var i = 0; i < socketList.length; i++){
      if(socket == socketList[i][0]){
        console.log(socketList[i][1] + " disconnected!");
        userHandler.removeUser(socketList[i][1]);
        socketList.splice(i,1);
        break;
      }
    }
  });
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
