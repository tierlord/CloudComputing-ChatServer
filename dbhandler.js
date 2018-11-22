var methods = {
    getDbUserByName: function(name, conn){
        conn.query('select * from users where username = ' + name, function (err, data) {
            if (err) console.log(err);
            else console.log(data);
            return data;
    });
},

    closeDb: function(conn){
        conn.close(function () {
            console.log('DB connection closed');
          });
    }

}

module.exports = methods;

