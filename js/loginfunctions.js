var loginEnabled = false;

$('#form').submit(function(e){
    e.preventDefault();
    var t = document.getElementById("textfield").value;
    console.log("Submit "+ t);
    if(t == ''){
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
    if(t.indexOf(' ') != -1){
        redTextfield(true);
        disableLogin();
        console.log("Error");
    } else {
        redTextfield(false);
        enableLogin();
    }
});

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