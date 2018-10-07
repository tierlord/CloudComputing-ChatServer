var socket = io();
var usr = ''; // username

$(document).ready(function(){
    var path = window.location.pathname;
    usr = path.replace('/chat/', '');
    if(usr != ''){
        socket.emit('hello', usr);
    } else {
        notRegistered();
    }

});
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
    var msgBubble = '<div class="bubble"><div class="head"><p class="name">' + name + '</p><p class="timestamp">' + time + '</p></div><p class="message">' + msg + '</p></div>';
    return msgBubble;
}	

$(function () {
    $('form').submit(function(){
        if(usr == '') return false;
        var msgtext = $('#m').val();
        socket.emit('chat message', usr + '\;' + getTime() + '\;' + msgtext);
        $('#messages').append(createMsgBubble(usr, getTime(), msgtext));
        $('#m').val('');
        window.scrollTo(0, document.body.scrollHeight);
        return false;
    });
    socket.on('chat message', function(msg){
        var m = parseMsg(msg);
        if(m.name != usr){
            $('#messages').append(createMsgBubble(m.name, m.time, m.text));
            window.scrollTo(0, document.body.scrollHeight);
        }    
    });
});

function notRegistered(){
    console.log("You are a guest");
    $('#btn').hide();
    $('#m').prop("readonly", true);
    $('#m').css("color", "gray");
    $('#m').val('You have to register first!');
}

function getTime(){
    var d = new Date();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    if(hours < 10) hours = "0" + String(hours);
    if(minutes < 10) minutes = "0" + String(minutes);
    return hours + ":" + minutes;
}