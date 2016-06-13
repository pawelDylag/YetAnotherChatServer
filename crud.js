var express = require('express');
var mongoose = require('mongoose');
var User = mongoose.model("User");
var Message = mongoose.model("Message");


/* Registers new user. */
var registerNewUser = function (username, password, callback) {
    console.log("registerNewUser");
    checkIfUserExists(username, function(err, exists) {
       if (!exists) {
           console.log("registerNewUser : !exsts");
           // no item exist, create new user
           var user = User();
           user.name = username;
           user.password = password;
           user.info = "Hello! I'm new to YetAnotherChat!";
           user.updated_at = Date.now();
           user.created_at = Date.now();
           user.save(function(err) {
               if (err) {
                   callback(err);
               } else {
                   callback(null);
               }
           })
       } else {
           console.log("registerNewUser: Exists");
           callback(new Error("User already exists"))
       }
   })
};

var loginUser = function(username, password, callback) {
    console.log("Logging in user: " + username);
    if (!username || !password) {
        callback(new Error("Username and password cannot be null"), true);
    } else {
        User.findOne({name : username, password : password}, function (err, user) {
            if (err) {
                callback(err, false);
            } else if (user) {
                // user exists, and password is correct
                user.online = true;
                user.save(function(err) {
                    if (!err) {
                        callback(null, true);
                    } else {
                        callback(err, false);
                    }
                });
            } else {
                callback(new Error("No user with that data."), true);
            }
        })
    }

};

var logoutUser = function(username, callback) {
    if (!username) {
        callback(new Error("Username cannot be null"), true);
    } else {
        User.findOne({name : username}, function (err, user) {
            if (err) {
                callback(err, false);
            }
            if (user) {
                // user exists
                user.online = false;
                user.save(function(err) {
                    if (!err) {
                        callback(null, true);
                    } else {
                        callback(err, false);
                    }
                });
            }
        })
    }

};

var getContactsForUser = function (username, callback) {
    User.findOne({name : username}, function (err, item) {
        if (err) {
            callback(err, null);
        }
        if (!item) {
            callback(null, null);
        } else {
            // get list of friends
            var friends = item.friends;
            User.find({'name' : {$in: friends}}, function (err, items) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, items);
                }
            })
        }
    })
};

var addContactToUser = function (userName, contactName,  callback) {
    User.findOne({name : userName}, function (err, user) {
        if (err) {
            callback(err, null);
        }
        if (!user) {
            callback(null, null);
        } else {
            user.friends.push(contactName);
            user.updated_at = Date.now();
            user.save(function(err) {
                if (err) {
                    callback(err);
                } else {
                    User.findOne({name : contactName}, function (err, contact) {
                        if (err) {
                            callback(err, null);
                        }
                        if (!contact) {
                            callback(null, null);
                        } else {
                            contact.friends.push(userName);
                            contact.updated_at = Date.now();
                            contact.save(function(err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null, true)
                                }
                            })
                        }
                    })
                }
            })
        }
    })

};

var getUsers = function (callback) {
  User.find({}, function(err, users) {
      if (!err) {
          callback(null, users);
      } else {
          callback(err, null);
      }
  })
};

var getMessageHistory = function(user1, user2, callback) {
    Message.find({'from' : {$in: [user1, user2]}, 'to' : {$in: [user1, user2]}}, function (err, messages) {
        if (!err) {
            callback(null, messages);
        } else {
            callback(err, null);
        }
    })

};

var addNewMessage = function(user1, user2, text, callback) {
    var message = new Message();
    message.from = user1;
    message.to = user2;
    message.text = text;
    message.timestamp = Date.now().valueOf();
    message.save(function(err) {
        if (!err){
            callback(null, message);
        } else {
            callback(err, null);
        }
    })

};

function checkIfUserExists(username, callback) {
    if (!username) {
        callback(new Error("Username cannot be null"), true);
    } else {
        User.findOne({name : username}, function (err, item) {
            if (err) {
                callback(err, true);
            }
            if (!item) {
                callback(null, false);
            } else callback(null, true);
        })
    }
}

function changeUserDescription(username, description,  callback) {
    if (!username) {
        callback(new Error("Username cannot be null"), true);
    } else {
        User.findOne({name : username}, function (err, item) {
            if (err) {
                callback(err, true);
            }
            if (item) {
                item.info = description;
                item.save(function(err) {
                    if (!err) {
                        callback(null, true);
                    } else {
                        callback(err, true);
                    }
                }) 
            } else callback(null, false);
        })
    }
}


module.exports.registerNewUser = registerNewUser;
module.exports.loginUser  = loginUser;
module.exports.getContactsForUser = getContactsForUser;
module.exports.addContactToUser = addContactToUser;
module.exports.logoutUser = logoutUser;
module.exports.getUsers = getUsers;
module.exports.getMessageHistory = getMessageHistory;
module.exports.addNewMessage = addNewMessage;
module.exports.changeUserDescription = changeUserDescription;
