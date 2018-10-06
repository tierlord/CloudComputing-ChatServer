var userList = [];

var methods = {
    addUser: function(name){
        userList.push(name);
        console.log(name + " added");
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