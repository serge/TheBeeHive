var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var routes = require('./routes/index');
var guest_routers = require('./routes/guest');
var rroom = require('./routes/room');

var app = express();

if(!fs.existsSync(path.join(__dirname, 'temp')))
    fs.mkdirSync(path.join(__dirname, 'temp'));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'bower_components')));


app.use('/', routes);
app.use('/guest', guest_routers.guest);
app.use('/guests', guest_routers.guests);
app.use('/rooms', rroom.rooms);
app.use('/room', rroom.room);
// catch 404 and forward to error handler
app.get('/partials/:name', function (req, res) {
    var name = req.params.name;
    console.log(name);
    res.render('partials/' + name);
});

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


module.exports = app;
