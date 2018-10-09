var userList = [];

var methods = {
    addUser: function(name){
        if(name == ''){
            console.log("Username can't be empty!");
            return false;
        }
        userList.push(name);
        console.log(name + " added");
        return true;
    },

    removeUser: function(name){
        var index = userList.indexOf(name);
        if(index > -1){
            userList.splice(index, 1);
            //console.log(name + " removed");
            return true;
        } else {
            return false;
        }    
    },

    getUsers: function(){
        return userList;
    },

    getLastUser: function(){
        return userList[userList.length-1];
    },

    checkUsername: function(name){
        for (var i = 0; i < userList.length; i++){
            if(name == userList[i]){
                return false;
            }
        }
        return true;
    }
};

module.exports = methods;