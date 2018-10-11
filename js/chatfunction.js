var socket = io();
var usr = ''; // username
var userList = []; // list of users

// When entering the chatroom, the own username is transmitted through the socket
$(document).ready(function(){
    var path = window.location.pathname;
    usr = path.replace('/chat/', '');
    if(usr != ''){
        socket.emit('hello', usr);
    } else {
        notRegistered();
    }
});

// A message contains username, time and the message itself.
// The three informations are split by "\;"
// This function returns an object, that contains the information separated
function parseMsg(m){
    var spl = m.split("\;");
    if(spl.length > 3) return false; // When the chat message contains the split character
    var msg = {
        name : spl[0],
        time : spl[1],
        text : spl[2]
    }
    return msg;
}	

function createMsgBubble(name, time, msg){
    if(name == usr){
        var msgBubble = '<div class="bubbleright animated"><div class="headright"><p class="name">' + name + '</p><p class="timestamp">' + time + '</p></div><p class="message">' + msg + '</p></div>';
    } else {
        var msgBubble = '<div class="bubble animated"><div class="head"><p class="name">' + name + '</p><p class="timestamp">' + time + '</p></div><p class="message">' + msg + '</p></div>';
    }
    
    return msgBubble;
}	

function enterNotification(name){
    var msgBubble = '<div class="lightBubble"><p class="name">' + name + ' has entered the room' +'</p></div>';
    return msgBubble;
}   

function exitNotification(name){
    var msgBubble = '<div class="lightBubble"><p class="name">' + name + ' has left the room' +'</p></div>';
    return msgBubble;
}

// Called then a message is sent. It will create a bubble without waiting
// for the transmission to the server. 
$('form').submit(function(){
    if(usr == '') return false;
    var msgtext = $('#m').val();
    socket.emit('chat message', usr + '\;' + getTime() + '\;' + msgtext);
    //window.scrollTo(0, document.body.scrollHeight + '70px');
    $('#messages').append(createMsgBubble(usr, getTime(), msgtext));
    $('#m').val('');
    window.scrollTo(0, document.body.scrollHeight);
    return false;
});

// When a chat message is received, this function is called.
// It only creates a bubble, if the messages comes from someone else.
socket.on('chat message', function(msg){
    var m = parseMsg(msg);
    if(m.name != usr){
        $('#messages').append(createMsgBubble(m.name, m.time, m.text));
        window.scrollTo(0, document.body.scrollHeight);
    }    
});
socket.on('enter chat',function(username){
    $('#messages').append(enterNotification(username));
    window.scrollTo(0, document.body.scrollHeight);
});
socket.on('exit chat', function(username){
    $('#messages').append(exitNotification(username));
    window.scrollTo(0, document.body.scrollHeight);
});
socket.on('user list', function(list){
    userList = list;
    console.log(userList);
});

// When you're not logged in, the textfield will not be functional
function notRegistered(){
    console.log("You are a guest");
    $('#btn').hide();
    $('#m').prop("readonly", true);
    $('#m').css("color", "gray");
    $('#m').val('You have to register first!');
}

// Gets the current time in the format: "10:35"
function getTime(){
    var d = new Date();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    if(hours < 10) hours = "0" + String(hours);
    if(minutes < 10) minutes = "0" + String(minutes);
    return hours + ":" + minutes;
}

// is called when choosing a recipient for a private message
function getUserSuggestions(){

}

function showList(){
    var box = $("#listBox");
    if(box.is(":visible")){
        box.hide();
    } else {
        var orderedList = $("#userListBox");
        orderedList.empty();
        for(var i = 0; i < userList.length; i++){
            console.log("PERSON: " + userList[i]);
            orderedList.append('<li>'+userList[i]+'</li>');
        }
        box.show();
    }

}