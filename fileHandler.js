// Contains uploaded files and the according sockets.
// If a Socket has file attached to it, it will be emitted
// with the next chat message
var imageList = []; // (Socket, File)

var methods = {
    addFile: function (socket, file) {
        imageList.push([socket, file]);
    },

    removeFile: function(socket){
        var index = imageList.indexOf(socket);
        if(index > -1){
            userList.splice(index, 1);
            console.log("File removed");
            return true;
        } else {
            return false;
        }    
    },

    getFile: function(socket){
        var index = -1;
        for(var i = 0; i < imageList.length; i++){
            if(socket == imageList[i][0]) index = i;
        }

        if(index > -1){
            console.log("This socket has a stored file")
            var file = imageList[index][1];
            userList.splice(index, 1);
            return file;
        } else {
            return false;
        }    
    }
};

module.exports = methods;