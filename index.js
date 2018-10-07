var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

var userHandler = require('./userHandler');

// serve the css and js files to the browser
// app.get('/css/*', function(req,res){
//   http.use(app.sta __dirname , '/css/' , req.params[0]);
// });
// app.get('/js/*', function(req,res){
//   res.sendFile(__dirname + '/js/' + req.params[0]);
// });

app.use('/js', express.static('js'));
app.use('/css', express.static('css'));
app.use('/img', express.static('img'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/login.html');
});

app.get('/chat/*', function(req, res){
  var name = req.params[0];
  console.log(name);
  if(userHandler.checkUsername(name)){
    userHandler.addUser(name);
    res.sendFile(__dirname + '/index.html');
  } else {
    res.sendFile(__dirname + "/login.html");
  }  
});

app.get('/user/*', function(req, res){
  var name = req.params[0];
  console.log("Check user: " + name);
  if(userHandler.checkUsername(name)){
    res.send('free');
  } else {
    res.send('used');
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
