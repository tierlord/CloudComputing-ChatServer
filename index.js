// Alina Elena Aldea-Ionescu - 310194
// Joffrey Schneider - 762380

var ibmdb = require("ibm_db");
var express = require("express");
var app = express();
var helmet = require("helmet");
var fs = require("fs");
var path = require("path");

app.use(express.static("res"));

app.use(helmet());

// app.use(
//   //Helmet’s csp module helps set Content Security Policies.
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "maxcdn.bootstrapcdn.com"]
//     }
//   })
// );

var VisualRecognitionV3 = require("watson-developer-cloud/visual-recognition/v3"); // watson sdk
var http = require("http").Server(app);
const fetch = require("node-fetch");
var io = require("socket.io")(http);
var port = process.env.PORT || 3000;

var dbString =
  "DATABASE=BLUDB;HOSTNAME=dashdb-txn-sbox-yp-lon02-01.services.eu-gb.bluemix.net;PORT=50001;PROTOCOL=TCPIP;UID=wwz36807;PWD=wb2fttzm+cgl8nwv;Security=SSL";

var userHandler = require("./userHandler");
var dbHandler = require("./dbhandler");

// This is to serve static files to the client
app.use("/js", express.static("js"));
app.use("/css", express.static("css"));
app.use("/img", express.static("img"));

// app.use(function(req, res, next) {
//   res.setHeader(
//     "Content-Security-Policy",
//     "script-src 'self' https://apis.google.com"
//   );
//   return next();
// });

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

  socket.on("login", function(loginData) {
    checkDbAccount(loginData.username, loginData.userpw, socket);
  });

  socket.on("register", function(userData) {
    createDbUser(userData, socket);
  });

  socket.on("check user available", function(username) {
    getDbUserByName(username, socket);
  });

  socket.on("check face", function(pictureUrl) {
    checkFace(pictureUrl, socket, false);
  });

  socket.on("change picture", function(pictureUrl, name) {
    checkFace(pictureUrl, socket, true, name);
  });
});

// Sends a list of usernames to all clients
function broadcastList() {
  var userList = userHandler.getUsers();
  io.emit("user list", userList);
}

function checkMood(msg) {
  var url = "https://ccchattone.eu-gb.mybluemix.net/tone";
  var data = JSON.stringify({ texts: [msg.text] });

  fetch(url, {
    method: "post",
    body: data,
    headers: { "Content-Type": "application/json", mode: "cors" }
  })
    .then(res => res.json())
    .then(function(json) {
      //msg.mood = JSON.parse(json).mood;
      var mood = json.mood;
      console.log("Mood: " + mood);
      if (mood == "happy") msg.mood = "happy";
      if (mood == "unhappy") msg.mood = "unhappy";
      io.emit("chat message", msg);
    });
}

function getDbUserByName(name, sock) {
  ibmdb.open(dbString, function(err, conn) {
    if (err) return console.log(err);
    conn.query("SELECT * FROM users where username = '" + name + "'", function(
      err,
      data
    ) {
      if (err) console.log(err);
      else {
        console.log("Users found: " + data.length);
        var free = data.length == 0;
        sock.emit("user available", free);
      }
    });
    conn.close(function() {
      console.log("DB connection closed");
    });
  });
}

function checkDbAccount(name, password, sock) {
  ibmdb.open(dbString, function(err, conn) {
    if (err) return console.log(err);
    conn.query("SELECT * FROM users where username = '" + name + "'", function(
      err,
      data
    ) {
      if (err) console.log(err);
      var existing = data.length != 0;
      if (existing && data[0].USERPW == password) {
        sock.emit("login", true, name, password, data[0].PICTURE, existing);
        socketList.push([sock, name]);
        if (userHandler.checkUsername(name)) {
          userHandler.addUser(name, data[0].PICTURE);
          sock.broadcast.emit("enter chat", userHandler.getLastUser());
        }
      } else {
        sock.emit("login", false, name, "", "", existing);
      }
    });
    conn.close(function() {});
  });
}

function createDbUser(data, sock) {
  ibmdb.open(dbString, function(err, conn) {
    if (err) return console.log(err);
    conn.query(
      "INSERT into users values ('" +
        data.username +
        "', '" +
        data.userpw +
        "', ?, '" +
        data.lastlogin +
        "');",
      [data.userpic],
      function(err, data) {
        if (err) {
          console.log(err);
          sock.emit("register", false);
        } else {
          console.log(data);
          sock.emit("register", true);
        }
      }
    );
    conn.close(function() {});
  });
}

function changeDbPic(pic, name) {
  ibmdb.open(dbString, function(err, conn) {
    if (err) return console.log(err);
    conn.query(
      "UPDATE USERS SET PICTURE = ? WHERE USERNAME = '" + name + "'",
      [pic],
      function(err, data) {
        if (err) {
          console.log(err);
        } else {
          console.log(data);
        }
      }
    );
    conn.close(function() {});
  });
}

function checkFace(dataUri, socket, update, name) {
  console.log("Face detection started...");
  var originalData = dataUri;

  dataUri = {
    type: dataUri.substr(0, dataUri.indexOf(",")),
    data: dataUri.substr(dataUri.indexOf(","))
  };

  var type = null;
  if (dataUri.type.indexOf("jpeg") != -1) type = "jpg";
  if (dataUri.type.indexOf("png") != -1) type = "png";

  if (type == null) {
    console.log("Unknown filetype!");
    return false;
  }

  var buf = Buffer.from(dataUri.data, "base64");

  fs.writeFile(path.join(__dirname, "face." + type), buf, function(error) {
    if (error) {
      throw error;
    } else {
      var visualRecognition = new VisualRecognitionV3({
        url: "https://gateway.watsonplatform.net/visual-recognition/api",
        version: "2018-03-19",
        iam_apikey: "7K6tDf8rFWkIMz_pcG5QZcTtKM6donGDTsT1QSKhqcoT"
      });

      console.log(path.join(__dirname, "face.") + type);

      var params = {
        images_file: fs.createReadStream(path.join(__dirname, "face.") + type)
      };

      visualRecognition.detectFaces(params, function(err, res) {
        if (err) {
          console.log(err);
        } else {
          var faces = res.images[0].faces.length;
          console.log("Faces detected: " + faces);
          var passed = faces > 0;

          if (update) {
            if (passed) changeDbPic(originalData, name);
            socket.emit("change pic", passed, originalData);
          } else {
            socket.emit("face checked", passed);
          }
        }
      });
      return true;
    }
  });
}

function requireHTTPS(req, res, next) {
  if (req.headers && req.headers.$wssp === "80") {
    return res.redirect("https://" + req.get("host") + req.url);
  }
  next();
}

app.use(requireHTTPS);

// This is the command to start the server
http.listen(port, function() {
  console.log("listening on *:" + port);
});

setInterval(broadcastList, 5000);
