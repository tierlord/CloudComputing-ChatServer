var socket = io();
var usr = ''; // username
var userList = []; // list of users
var attachedFile = null;

// When entering the chatroom, the own username is transmitted through the socket
$(document).ready(function(){
    var path = window.location.pathname;
    usr = path.replace('/chat/', '');
    if(usr != ''){
        socket.emit('hello', usr);
    } else {
        notRegistered();
    }
    var input = $('#m');

    $("#userListBox").append('<li class="listItem">'+ usr +'</li>');

    input.keyup(function(){
        if(input.val() == '\\list'){
            showList();
            input.val('');
        }
    });

    $('body').on('click',function(e){
        var tar = $(event.target).attr('class');
        if($("#listBox").is(":visible")){
            if(tar != 'navbar-toggle' && tar != 'icon-bar'){
                $('#listBox').fadeOut();
            }
        }
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

function createMsgBubble(name, time, msg, file){
    if(name == usr){
        var msgBubble = '<div class="bubbleright animated"><div class="headright">';
    } else {
        var msgBubble = '<div class="bubble animated"><div class="head">';
    }
    msgBubble +=    '<p class="name">' + name + '</p>';
    msgBubble +=    '<p class="timestamp">' + time + '</p></div>';
    msgBubble +=    '<p class="message">' + msg + '</p>';
    if(file != null) msgBubble += '<img class="msgimg" src="' + file + '"></img>';
    msgBubble +=    '</div>'
    return msgBubble;
}

function createMsgBubblePrivate(name, time, msg, recipient){
    if(name == usr) {
        var msgBubble = '<div class="bubbleright animated"><div class="headright">';
    } else {
        var msgBubble = '<div class="bubble animated"><div class="head">';
    }
    msgBubble +=    '<p class="name">' + '<i></i> Private: ' + recipient + '</p>';
    msgBubble +=    '<p class="timestamp">' + time + '</p></div>';
    msgBubble +=    '<p class="message">' + msg + '</p></div>';
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
        text: '',
        file: null
    }
 
    if(attachedFile != null){
        msg.file = attachedFile;
        attachedFile = null;
        $('#thumbnail').hide();
        $('#close').hide();
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
        //msg.file = "data:image/png;base64,"+ img.toString("base64");
        socket.emit('chat message', msg);
        $('#messages').append(createMsgBubble(usr, getTime(), msgtext, msg.file));
    }    
    $('#m').val('');
    window.scrollTo(0, document.body.scrollHeight);
    $('#m').focus();
    return false;
});

// When a chat message is received, this function is called.
// It only creates a bubble, if the messages comes from someone else.
socket.on('chat message', function(msg){
    if(msg.sender != usr){
        $('#messages').append(createMsgBubble(msg.sender, msg.time, msg.text, msg.file));
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
    console.log("showlist");
    var box = $("#listBox");
    if(box.is(":visible")){
        box.fadeOut();
    } else {
        box.fadeIn();
    }
}

function addPrivate(name){
    if(name == usr) return false;
    $('#m').val("@" + name + " ");
    $('#listBox').hide();
    $('#m').focus();
}

//----------------------------------------------------------------------------------
//Drag and Drop

function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();    

    // Hide the dropzone
    var dz = $('#drop_zone');
    dz.css('border','none');
    dz.css('background','none');

    var files;
    if(evt.type == 'drop'){
        files = evt.dataTransfer.files; // FileList object.
    } else {
        files = document.getElementById('file').files;
    }

    var reader = new FileReader();
    reader.onload = function(){
        var dataURL = reader.result;
        attachedFile = dataURL;
        var thumb = $('#thumbnail');
        thumb.css('background-image', 'url(' + attachedFile + ')');
        thumb.fadeIn("slow", function(){$('#close').show();});        
    };
    reader.readAsDataURL(files[0]);

}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    var dz = $('#drop_zone');
    dz.css('border', '2px dashed #555');
    dz.css('background','#ffffffab');
}

function handleDragEnd(evt){
    var dz = $('#drop_zone');
    dz.css('border','none');
    dz.css('background','none');
}

// Setup the dnd listeners.
var dropZone = document.getElementById('drop_zone');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('dragleave', handleDragEnd, false);
dropZone.addEventListener('drop', handleFileSelect, false);
$('#file').on('change', handleFileSelect);

function deleteAtt(){
    attachedFile=null;
    $('#thumbnail').fadeOut();
    $('#close').hide();
}

function mouseDown(){
    $('#drop_zone').hide();
}

function mouseUp(){
    $(this).attr('download','element');
     $('#drop_zone').show();
}