var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model("User");

router.get('/:username', function(req, res, next) {
    
});