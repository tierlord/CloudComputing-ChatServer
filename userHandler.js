// Alina Elena Aldea-Ionescu - 310194
// Joffrey Schneider - 762380

var userList = [];

var methods = {
    addUser: function(username, pic){
        if(username == ''){
            console.log("Username can't be empty!");
            return false;
        }
        var usr = {
            name: username,
            picture: pic
        }
        userList.push(usr);
        console.log(usr.name + " added");
        userList.sort(function(a, b){
            var nameA=a.name.toLowerCase(), nameB=b.name.toLowerCase();
            if (nameA < nameB) //sort string ascending
             return -1;
            if (nameA > nameB)
             return 1;
            return 0; //default return value (no sorting)
           });
        return true;
    },

    removeUser: function(name){
        var index = -1;
        for(var i; i < userList.length; i++){
            if(userList[i].name == name){
                index = i;
            }
        }
        if(index >= 0){
            userList.splice(index, 1);
            console.log(name + " removed");
            return true;
        } else {
            return false;
        }    
    },

    getUsers: function(){
        return userList;
    },

    getLastUser: function(){
        if(userList.length > 0) {
            return userList[userList.length-1].name;
        } else return [];        
    },

    checkUsername: function(name){
        for (var i = 0; i < userList.length; i++){
            if(name == userList[i].name){
                return false;
            }
        }
        return true;
    }
};

module.exports = methods;