var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var db = require( './db' );
var routes = require('./routes/index');
var users = require('./routes/users');
var crud = require('./crud');

var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});




var currentSockets = [];
var currentUsers = [];
// handling messaging for one connection
io.sockets.on('connection', function(socket) {

    // Register your client with the server, providing your username
    socket.on('register', function(username, password) {
        crud.registerNewUser(username, password, function (err){
            if (err) {
                console.log("Error while registering new user");
                // send response with error
                socket.emit("register",{
                    operation : "register",
                    message : "failure"
                });
            } else {
                console.log("Successfully registered new user with name: " + username);
                // send response with error
                socket.emit("register",{
                    operation : "register",
                    message : "success"
                });
            }
        });
    });

    // Login user
    socket.on('login', function (username, password) {
        crud.loginUser(username, password, function(err, authorized) {
            if (err || !authorized) {
                if (err) {
                    console.log("Error while logging");
                } else {
                    console.log("Logging unauthorized.");
                }
                // send response with error
                socket.emit("login", {
                    operation : "login",
                    message : "failure"
                });
            } else {
                console.log("Successfully logged in user: " + username +" with socket id = " + socket.id);
                currentUsers[username] = socket.id;
                currentSockets[socket.id] = {
                    username : username,
                    socket : socket
                };
                socket.emit("login", {
                    operation : "login",
                    message : "success"
                });
            }
        });
    });
    
    socket.on('get_contacts', function(username) {
        console.log("get contacts");
        crud.getContactsForUser(username, function (err, contacts) {
            if (!err) {
                console.log("Contacts for user " + username + " : " + contacts.length);
                socket.emit("get_contacts", {
                    operation : "get_contacts",
                    message : "success",
                    data : contacts
                });
            } else {
                console.log("Error while getting contacts for user " + username );
                socket.emit("get_contacts", {
                    operation : "get_contacts",
                    message : "failure"
                });
            }
        })
    });

    socket.on('add_contact', function(username) {
        crud.addContactToUser(currentSockets[socket.id].username, username, function (err, contacts) {
            if (!err) {
                socket.emit("add_contact", {
                    operation : "add_contact",
                    message : "success"
                });
            } else {
                socket.emit("add_contact", {
                    operation : "add_contact",
                    message : "failure"
                });
            }
        })
    });

    socket.on('get_users', function() {
        crud.getUsers(function (err, contacts) {
            if (!err) {
                console.log("Get users number: " + contacts.length);
                socket.emit("get_users", {
                    operation : "get_users",
                    message : "success",
                    data : contacts
                });
            } else {
                console.log("Get users ");
                socket.emit("get_users", {
                    operation : "get_users",
                    message : "failure"
                });
            }
        })
    });


    // Private message
    socket.on('message_history', function(user1, user2) {
        // Lookup the socket of the user you want to private message, and send them your message
        crud.getMessageHistory(user1, user2, function (err, messages) {
            if (!err) {
                console.log("Successfully returned message history for " + user1 + " and " + user2);
                socket.emit("message_history", {
                    operation : "message_history",
                    message : "success",
                    history : messages
                });
            } else {
                console.log("Error while returning message history for " + user1 + " and " + user2);
                socket.emit("message_history", {
                    operation : "message_history",
                    message : "failure"
                });
            }
        })

    });
    

    // Private message
    socket.on('message', function(from, to, text) {
        console.log("Received new message from " + from + " to " + to + " : " + text);
        crud.addNewMessage(from, to, text, function(err, message) {
            if (!err){
                if (currentSockets[currentUsers[to]]){
                    console.log("Sending message to socket " + currentUsers[to] );
                    currentSockets[currentUsers[to]].socket.emit('message', message);
                } else {
                    console.log("Receiver is offline. Adding to history.");
                }
            } else {
                console.log("Error while sending message");
            }
        });
    });

    socket.on('change_description', function(description) {
        var username = currentSockets[socket.id].username;
        console.log("Changing " + username + " description to " + description);
        crud.changeUserDescription(username, description, function(err, ok) {
            if (!err && ok) {
                socket.emit("change_description", {
                    operation : "change_description",
                    message : "success"
                });
            } else {
                socket.emit("change_description", {
                    operation : "change_description",
                    message : "failure"
                });
            }
        });
    });

    socket.on('logout', function() {
        if (currentSockets[socket.id]) {
            var username = currentSockets[socket.id].username;
            console.log("Logged out " + username);
            crud.logoutUser(username, function (err) {
                // nothin
            });
            currentUsers.slice(username, 1);
            currentSockets.slice(socket.id, 1);
        }
    });

    socket.on('disconnect', function() {
        console.log("Trying to disconnect " );
        if (currentSockets[socket.id]){
            var username = currentSockets[socket.id].username;
            console.log("Disconnected " + username);
            crud.logoutUser(username, function (err) {
                // nothin
            });
            currentUsers.slice(username, 1);
            currentSockets.slice(socket.id, 1);
        }
    });

    socket.on('status', function (newStatus) {

    })
});


module.exports = app;
