/**
 * Created by paweldylag on 05/06/2016.
 */
var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;

var User = new Schema({
    name : String,
    password : String,
    online : Boolean,
    info : String,
    friends : [String],
    updated_at : Date,
    created_at : Date
});

var Message = new Schema({
    from : String,
    to : String,
    text : String,
    timestamp : Number
});

mongoose.model( 'Message', Message);
mongoose.model( 'User', User );
mongoose.connect( 'mongodb://localhost/chat-db' );