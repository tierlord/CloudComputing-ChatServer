// Alina Elena Aldea-Ionescu - 310194
// Joffrey Schneider - 762380

var loginEnabled = false;

$(document).ready(function() {
  var url = location.pathname;
  console.log(url);
  if (url.startsWith("/chat/")) {
    disableLogin();
    var name = url.substring(6);
    if (checkValidation(name) || name == "") {
      $("#textfield").val(name);
      setTimeout(login, 1000);
    } else {
      alert("Your username must not contain special characters!");
      location.href = "/";
    }
  }
});

function login() {
  var t = $("#textfield").val();
  // Check if username is free
  $.get("/user/" + t, function(data, status) {
    console.log(data);
    if (data == "used") {
      alert("Sorry, username is already taken.");
      location.pathname = "";
    }
    if (data == "free") {
      // login with username
      console.log("Logging in as " + t);
      location.pathname = "";
      location.href = "/chat/" + t;
    }
  });
}

$("#form").submit(function(e) {
  e.preventDefault();
  var t = $("#textfield").val();
  checkValidation(t);
  if (!loginEnabled) {
    redTextfield(true);
    return false;
  }
  login();
  return false;
});

$("#textfield").on("input", function() {
  var t = document.getElementById("textfield").value;
  console.log(t + ": " + checkValidation(t));
  if (!checkValidation(t) || t.length > 30) {
    redTextfield(true);
    disableLogin();
  } else {
    redTextfield(false);
    enableLogin();
  }
});

function checkValidation(text) {
  console.log("ok: " + text);
  var valid = /^[0-9a-zA-Z\_]+$/;
  if (text.match(valid)) return true;
  else return false;
}

function redTextfield(enabled) {
  if (enabled) $("#textfield").css("borderBottom", "1px solid #f00");
  else $("#textfield").css("borderBottom", "1px solid #fff");
}

function disableLogin() {
  loginEnabled = false;
}

function enableLogin() {
  loginEnabled = true;
}
