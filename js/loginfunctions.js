var loginEnabled = false;

$('#form').submit(function(e){
    e.preventDefault();
    var t = document.getElementById("textfield").value;
    checkValidation(t);
    if(!loginEnabled){
        redTextfield(true);
        return false;
    }
    // Check if username is free
    $.get("user/" + t, function(data, status){
        if(data == 'used'){
            alert("Sorry, username is already taken.");
        }
        if(data == 'free'){
            // login with username					
            location.href = "/chat/" + t;					
        }
    });			
    return false;
});

$('#textfield').on('input', function(){
    var t = document.getElementById("textfield").value;
    console.log(t + ": " + checkValidation(t));
    if(!checkValidation(t) || t.length > 30){
        redTextfield(true);
        disableLogin();
    } else {
        redTextfield(false);
        enableLogin();
    }
});

function checkValidation(text){
    console.log("ok: " + text);
    var valid = /^[0-9a-zA-Z\_]+$/;
    if(text.match(valid)) return true;
    else return false;
}

function redTextfield(enabled){
    if(enabled) $('#textfield').css('borderBottom', '1px solid #f00');
    else $('#textfield').css('borderBottom', '1px solid #fff');
}

function disableLogin(){
    loginEnabled = false;    
}

function enableLogin(){
    loginEnabled = true;
}