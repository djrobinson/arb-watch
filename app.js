var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var ExchangeAggregator = require('./server-build/integrations/ExchangeAggregator');
var indexRouter = require('./server-build/api/index');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'client/build')));

io.on('connection', function(client) {
  const requestedExchanges = ['bittrex', 'poloniex'];
  const exchangeAggregator = new ExchangeAggregator(requestedExchanges);
  console.log("Inside of ECHO");
  const aggregatorCallback = function(msg) {
    client.emit('test', msg);
  };


  exchangeAggregator.subscribeToOrderBooks(aggregatorCallback);
  client.on('disconnect', req => {
    console.log("Websocket closing");
    client.disconnect(true);

  });

  client.on('error', function(error) {
    if(error != null) {
        console.log('error: %s', error);

    }
  });

  client.on('end', function() {
    console.log("Websocket closing");
    client.disconnect(true);
  });
});


app.use('/api', indexRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = {app: app, server: server};
