// Alina Elena Aldea-Ionescu - 310194
// Joffrey Schneider - 762380

var socket = io();

var loginEnabled = true;
var pic;

$(document).ready(function() {
  $("#message").hide();
  var url = location.pathname;
  console.log(url);
  $("#overlay").fadeOut();
  if (url.startsWith("/chat/")) {
    disableLogin();
    var name = url.substring(6);
    if (checkValidation(name) || name == "") {
      $("#textfield").val(name);
      location.href = "/";
    }
  }

  setTimeout(function(){
      if ($("#textfield").val() == '' || $("#textfield2").val() == '') {
        disableLogin();
      }
  }, 500);
});

function hash(s){
  return s.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0);              
}

function login() {
  var loginData = {
    username : $('#textfield').val(),
    userpw : $('#textfield2').val()
  }
  console.log("Login: " + loginData.username + ':' + loginData.userpw);
  socket.emit("login", loginData);
  $("#overlay").fadeIn();
}

socket.on("login", function (correct, name, pw, pic, existing){
  $("#overlay").fadeOut();
  console.log("corr " + correct + " ex: " + existing);
  if (correct) {
    // login with username
    console.log("Logging in as " + name);
    Cookies.set("creds", name + ":" + pw);
    location.pathname = "";
    location.href = "/chat/";
  }
  else if (existing) alert("Wrong credentials!");
  if (!correct && !existing) {
    $("#message").show();
    $("#btn-login").css("background", "black");
    $("#btn-register").css("background", "#906ec4");
  }
});

socket.on("register", function(okay){
  $("#overlay").fadeOut();
  $("#uploaddiv").hide();
  $("#message").hide();
  $("#form").fadeIn();
  if(!okay) alert("Error");
});

$("#btn-login").click(function(e) {
  e.preventDefault();
  var t = $("#textfield").val();
  checkValidation(t);
  if (!loginEnabled) {
    return false;
  }
  login();
});

$("#btn-register").click(function(e) {
  $("#form").hide();
  $("#uploaddiv").fadeIn();
});

$("#textfield").on("input", function() {
  var pwfield = ($('#textfield2').val() != '');
  var t = document.getElementById("textfield").value;
  console.log(t + ": " + checkValidation(t));
  if (!checkValidation(t) || t.length > 30) {
    disableLogin();
  } else {
    if (pwfield) enableLogin();
  }
});

$("#textfield2").on("input", function() {
  var namefield = ($('#textfield').val() != '');
  var pwfield = ($('#textfield2').val() != '');
  if(namefield && pwfield) enableLogin();
  else disableLogin();
});

$("#btn-okay").on("click", function(){
  var userData = {
    username: $("#textfield").val(),
    userpw: $("#textfield2").val(),
    userpic: pic,
    lastlogin: "26.11.2018"
  };

  console.log(pic.length);
  socket.emit("register", userData);
  $("#overlay").fadeIn();
});

$("#file").on("change", function(e){
  var reader = new FileReader();
  reader.onload = (function(){
    pic = reader.result;
    console.log("Picture uploaded." + pic);
    $("#profilepic").attr("src", pic);
    $("#btn-okay").show();
  });
  reader.readAsDataURL(e.target.files[0]);
});

function checkValidation(text) {
  var valid = /^[0-9a-zA-Z\_]+$/;
  if (text.match(valid)) return true;
  else return false;
}

function disableLogin() {
  $( ":button" ).css('color','gray');
  loginEnabled = false;
}

function enableLogin() {
  $( ":button" ).css('color','white');
  loginEnabled = true;
}
