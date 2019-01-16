// Alina Elena Aldea-Ionescu - 310194
// Joffrey Schneider - 762380

var socket = io();
var usr = ""; // username
var userList = []; // list of users
var attachedFile = null;

// When entering the chatroom, the own username is transmitted through the socket
$(document).ready(function() {
  var cookie = Cookies.get("creds");
  if (cookie != null) {
    cookie = cookie.split(":");
    usr = cookie[0];
    var pw = cookie[1];
    console.log("Emitting hello " + usr + ": " + pw);
    socket.emit("hello", usr, pw);
  } else {
    notRegistered();
  }
  var input = $("#m");

  $("#userListBox").append('<li class="listItem">' + usr + "</li>");

  input.keyup(function() {
    if (input.val() == "\\list") {
      showList();
      input.val("");
    }
  });

  setupDragDropListeners();

  $("body").on("click", function(e) {
    var tar = $(e.target).attr("class");
    if ($("#listBox").is(":visible")) {
      if (tar != "navbar-toggle" && tar != "icon-bar") {
        $("#listBox").fadeOut();
      }
    }
  });
});

function createMsgBubble(msg) {
  var mood = msg.mood;
  var name = msg.sender;
  var time = msg.time;
  var text = msg.text;
  if (name == usr) {
    var msgBubble =
      '<div class="bubble right animated"><div class="headright">';
  } else {
    var msgBubble = '<div class="bubble animated"><div class="head">';
  }
  msgBubble += '<p class="name">' + name + "</p>";
  if (mood == "happy") msgBubble += '<p class="mood">' + "🙂" + "</p>";
  if (mood == "unhappy") msgBubble += '<p class="mood">' + "😡" + "</p>";
  msgBubble += '<p class="timestamp">' + time + "</p></div>";
  msgBubble += '<p class="message"><xmp>' + text + "</xmp></p>";
  if (msg.file != null) {
    console.log("File attached!");
    var type = mimeTypeOf(msg.file);
    if (type.startsWith("image")) {
      msgBubble += '<a href="' + msg.file + '" download="' + type + '">';
      msgBubble +=
        '<img class="msgimg" onmouseover="bigImg(event)" onmouseleave="normImg(event)" src="' +
        msg.file +
        '"></img></a>';
    }
    if (type.startsWith("video")) {
      msgBubble +=
        '<video controls class="msgvid"><source type="' +
        type +
        '" src="' +
        msg.file +
        '"></video></a>';
    }
    if (type.startsWith("audio")) {
      msgBubble +=
        '<audio controls class="msgaudio"><source type="' +
        type +
        '" src="' +
        msg.file +
        '"></audio></a>';
    }
  }
  msgBubble += "</div>";
  return msgBubble;
}

function createMsgBubblePrivate(msg) {
  var mood = msg.mood;
  var name = msg.sender;
  var recipient = msg.recipient;
  var time = msg.time;
  var text = msg.text;

  if (name == usr) {
    var msgBubble =
      '<div class="bubble right animated"><div class="headright">';
    msgBubble += '<p class="name">' + "Private to: " + recipient + "</p>";
  } else {
    var msgBubble = '<div class="bubble private animated"><div class="head">';
    msgBubble += '<p class="name">' + "<i></i> Private from: " + name + "</p>";
  }
  msgBubble += '<p class="timestamp">' + time + "</p></div>";
  msgBubble += '<p class="message"><xmp>' + text + "</xmp></p>";
  if (msg.file != null) {
    var file = msg.file;
    var type = mimeTypeOf(file);
    if (type.startsWith("image")) {
      msgBubble += '<a href="' + file + '" download="' + type + '">';
      msgBubble +=
        '<img class="msgimg" onmouseover="bigImg(event)" onmouseleave="normImg(event)" src="' +
        file +
        '"></img></a>';
    }
    if (type.startsWith("video")) {
      msgBubble +=
        '<video controls class="msgvid"><source type="' +
        type +
        '" src="' +
        file +
        '"></video></a>';
    }
    if (type.startsWith("audio")) {
      msgBubble +=
        '<audio controls class="msgaudio"><source type="' +
        type +
        '" src="' +
        file +
        '"></audio></a>';
    }
  }
  msgBubble += "</div>";
  return msgBubble;
}

function enterNotification(name) {
  var msgBubble =
    '<div class="lightBubble"><p class="name">' +
    name +
    " has joined the chat" +
    "</p></div>";
  return msgBubble;
}

function exitNotification(name) {
  var msgBubble =
    '<div class="lightBubble"><p class="name">' +
    name +
    " has left the chat" +
    "</p></div>";
  return msgBubble;
}

// Called then a message is sent. It will create a bubble without waiting
// for the transmission to the server.
$("form").submit(function() {
  if (usr == "") return false; // Don't do anything if you're a guest

  var msgtext = $("#m").val();

  // don't send if there is nothing to send
  if (msgtext == "") {
    if (attachedFile == null) return false;
  }

  // Create a message object
  var msg = {
    recipient: "",
    sender: usr,
    time: getTime(),
    text: "",
    file: null,
    mood: ""
  };

  if (attachedFile != null) {
    msg.file = attachedFile;
    attachedFile = null;
    $("#thumbnail").hide();
    $("#close").hide();
  }

  // If private message
  if (msgtext.charAt(0) == "@") {
    var spaceIndex = msgtext.indexOf(" ");
    if (spaceIndex != -1) {
      var recp = msgtext.substring(1, spaceIndex);
      var existing = userList.some(function(a){return a.name===recp});
      if (existing) msg.recipient = recp;
      else {
        alert("There is no user called " + recp);
        return false;
      }
      msg.text = msgtext.substring(spaceIndex + 1, msgtext.length);
      if (msg.text == "" && msg.file == null) return false;
      socket.emit("private message", msg);
      $("#messages").append(
        createMsgBubblePrivate(msg)
      );
    } else return false; // When there is no message

    // If public message
  } else {
    msg.recipient = "all";
    msg.text = msgtext;
    socket.emit("chat message", msg);
    $("#messages").append(createMsgBubble(msg));
  }
  $("#m").val("");
  scrollDown();
  $("#m").focus();
  return false;
});

// When a chat message is received, this function is called.
// It only creates a bubble, if the messages comes from someone else.
socket.on("chat message", function(msg) {
  if (msg.sender != usr) {
    $("#messages").append(createMsgBubble(msg));
    scrollDown();
  }
});

socket.on("private message", function(msg) {
  if (msg.sender != usr) {
    $("#messages").append(createMsgBubblePrivate(msg));
    scrollDown();
  }
});

socket.on("enter chat", function(username) {
  console.log("Enter chat: " + username);
  if (username == null) return false;
  $("#messages").append(enterNotification(username));
  scrollDown();
});

socket.on("exit chat", function(username) {
  $("#messages").append(exitNotification(username));
  scrollDown();
});

socket.on("user list", function(list) {
  userList = list;
  updateList();
});

socket.on("login", function(correct, name, pw, pic, existing) {
  if (!correct) {
    notRegistered();
  } else {
    $("#profile-pic").attr("src", pic);
  }
});

socket.on("change pic", function(passed, uri){
  console.log("Change pic received from socket. Status: " + passed);
  if(passed){
    var thumb = document.getElementById("profile-pic");
    thumb.src = uri
  } else alert("No face detected!");
});

// When you're not logged in, the textfield will not be functional
function notRegistered() {
  console.log("You are a guest");
  $("#profile").hide();
  $("#btn").hide();
  $("#m").prop("readonly", true);
  $("#m").css("color", "gray");
  $("#m").val("You have to login first!");
  $("#m").on("click", function(){
    location.href = "/";
  });
}

// Gets the current time in the format: "10:35"
function getTime() {
  var d = new Date();
  var hours = d.getHours();
  var minutes = d.getMinutes();
  if (hours < 10) hours = "0" + String(hours);
  if (minutes < 10) minutes = "0" + String(minutes);
  return hours + ":" + minutes;
}

function updateList() {
  console.log("Update Userlist, length: " + userList.length);
  var list = $("#userListBox");
  var templist = [];

  list.empty();
  for (var i = 0; i < userList.length; i++) {
    var usnm = userList[i].name;
    if (usnm == usr) {
      // Own user
      list.append('<li class="listItem ownusr">' + usnm + "</li>");
    } else {
      templist.push(
        '<li class="listItem" onclick="addPrivate(\'' +
          usnm +
          "')\">" +
          "<img class='smallpic' src='" + userList[i].picture + "'/>" +
          usnm +
          "</li>"
      );
    }
  }
  for(var i=0; i<templist.length; i++){
    list.append(templist[i]);
  }
}

function showList() {
  console.log("showlist");
  var box = $("#listBox");
  if (box.is(":visible")) {
    box.fadeOut();
  } else {
    box.fadeIn();
  }
}

function addPrivate(name) {
  if (name == usr) return false;
  $("#m").val("@" + name + " ");
  $("#listBox").hide();
  $("#m").focus();
}

function scrollDown() {
  window.scrollTo(0, document.body.scrollHeight);
}

$("#upload-pic-btn").on("change", function(e){
  console.log("Profile pic change");

  var reader = new FileReader();
  reader.onload = function() {
    socket.emit("change picture", reader.result, usr);
  };
  reader.readAsDataURL(e.target.files[0]);
});

function logout() {
  Cookies.remove('creds');
  location.href = "/";
}
