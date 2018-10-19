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
    $("#listBox").focusout(function (){
        $("#listBox").hide();
    });
    $('#m').focus();
    $("#userListBox").append('<li class="listItem">'+usr+'</li>');

    $('body').on('click',function(e){

        if(e.target.id=='navbar-toggleId')
            return;
        //put constraints on descendents
        if($(e.target).closest('navbar-toggleId').length)
            return;

        if($(e.target).attr('class')==='icon-bar')
            return;

        $('#listBox').fadeOut();
    });
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
        var msgBubble = '<div class="bubbleright animated"><div class="headright">';
        msgBubble +=    '<p class="name">' + name + '</p>';
        msgBubble +=    '<p class="timestamp">' + time + '</p></div>';
        msgBubble +=    '<p class="message">' + msg + '</p></div>';
    } else {
        var msgBubble = '<div class="bubble animated"><div class="head">';
        msgBubble +=    '<p class="name">' + name + '</p>';
        msgBubble +=    '<p class="timestamp">' + time + '</p></div>';
        msgBubble +=    '<p class="message">' + msg + '</p></div>';
    }    
    return msgBubble;
}

function createMsgBubblePrivate(name, time, msg, recipient){
    if(name == usr){
        var msgBubble = '<div class="bubbleright animated"><div class="headright">';
        msgBubble +=    '<p class="name">' + name + ' > ' + recipient + '</p>';
        msgBubble +=    '<p class="timestamp">' + time + '</p></div>';
        msgBubble +=    '<p class="message">' + msg + '</p></div>';
    } else {
        var msgBubble = '<div class="bubble animated"><div class="head">';
        msgBubble +=    '<p class="name">' + recipient + ' > ' + name + '</p>';
        msgBubble +=    '<p class="timestamp">' + time + '</p></div>';
        msgBubble +=    '<p class="message">' + msg + '</p></div>';
    }    
    return msgBubble;
}

function enterNotification(name){
    var msgBubble = '<div class="lightBubble"><p class="name">' + name + ' has joined the chat' +'</p></div>';
    return msgBubble;
}   

function exitNotification(name){
    var msgBubble = '<div class="lightBubble"><p class="name">' + name + ' has left the chat' +'</p></div>';
    return msgBubble;
}

// Called then a message is sent. It will create a bubble without waiting
// for the transmission to the server. 
$('form').submit(function(){
    if(usr == '') return false; // Don't do anything if you're a guest
    
    var msgtext = $('#m').val();
    if(msgtext == '') return false;

    // Create a message object
    var msg = {
        recipient: '',
        sender: usr,
        time: getTime(),
        text: ''
    }

    // If private message
    if(msgtext.charAt(0) == '@'){
        var spaceIndex = msgtext.indexOf(' ');
        if(spaceIndex != -1){
            msg.recipient = msgtext.substring(1, spaceIndex);
            msg.text = msgtext.substring(spaceIndex+1, msgtext.length);
            if(msg.text == '') return false;
            socket.emit('private message', msg);
            $('#messages').append(createMsgBubblePrivate(usr, getTime(), msg.text, msg.recipient));
        } else return false; // When there is no message
    
        // If public message
    } else {        
        msg.recipient = 'all';
        msg.text = msgtext;
        socket.emit('chat message', msg);
        $('#messages').append(createMsgBubble(usr, getTime(), msgtext));
    }    
    $('#m').val('');
    window.scrollTo(0, document.body.scrollHeight);
    return false;
});

// When a chat message is received, this function is called.
// It only creates a bubble, if the messages comes from someone else.
socket.on('chat message', function(msg){
    if(msg.sender != usr){
        $('#messages').append(createMsgBubble(msg.sender, msg.time, msg.text));
        window.scrollTo(0, document.body.scrollHeight);
    }    
});

socket.on('private message', function(msg){
    if(msg.sender != usr){
        $('#messages').append(createMsgBubblePrivate(msg.sender, msg.time, msg.text, msg.recipient));
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
    updateList();
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

function updateList(){
    console.log("Update Userlist, length: " + userList.length);
    var list = $("#userListBox");
    list.empty();
    for(var i = 0; i < userList.length; i++){
        var usnm = userList[i];
        list.append('<li class="listItem" onclick="addPrivate(\''+usnm+'\')">'+usnm+'</li>');
    }
}

function showList(){
    var box = $("#listBox");
    if(box.is(":visible")){
        box.hide();
    } else {
        box.show();
    }
}

function addPrivate(name){
    if(name == usr) return false;
    $('#m').val("@" + name + " ");
    $('#listBox').hide();
    $('#m').focus();
}