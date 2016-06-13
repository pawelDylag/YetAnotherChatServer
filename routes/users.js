var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model("User");
var Message = mongoose.model("Message");

/* GET users listing. */
router.get('/', function(req, res, next) {
        User.find(function(err, users) {
            if (err)
                res.send(err);

            res.json(users);
        });
});

/* GET one user by name */
router.get('/:name', function(req, res, next) {
    User.findOne({name : req.params.name}, function(err, user) {
        if (err)
            res.send(err);
        res.json(user);
    });
});


/* GET messages to given user */
router.get('/:to/messages/:from', function(req, res, next) {
    Message.find({to : req.params.to, from : req.params.from}, function(err, user) {
        if (err)
            res.send(err);
        res.json(user);
    });
});

/* POST new messages to given user */
router.post('/:name/messages', function(req, res, next) {
    var message = Message();
    message.from = req.body.from;
    message.to = req.body.to;
    message.text = req.body.text;
    message.created_at = Date.now();
    if (message.from == null || message.to == null)
        res.json({message : 'From and to must be a valid value'});
    else {
        message.save(function (err) {
            if (err)
                res.send(err);
            res.json({message: 'Success'});
        });
    }
});

module.exports = router;
