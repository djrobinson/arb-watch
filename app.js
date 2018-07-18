const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const ExchangeAggregator = require('./server-build/base/ExchangeAggregator');
const indexRouter = require('./server-build/api/index');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'client/build')));

io.on('connection', client => {
  const exchanges = ['bittrex', 'poloniex'];
  const exchangeAggregator = new ExchangeAggregator(exchanges);
  const aggregatorCallback = msg => {
    client.emit('orderbook', msg);
  };

  client.on('startMarket', req => {
    exchangeAggregator.removeAllSubscriptions();
    exchangeAggregator.subscribeToOrderBooks(req.market, aggregatorCallback);
  });

  client.on('disconnect', req => {
    console.log("Websocket closing");
    exchangeAggregator.removeAllSubscriptions();
    client.disconnect(true);
  });

  client.on('error', error => {
    if(error != null) {
        console.log('error: %s', error);
    };
  });

  client.on('end', () => {
    console.log("Websocket closing");
    exchangeAggregator.removeAllSubscriptions();
    client.disconnect(true);
  });
});


app.use('/api', indexRouter);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/build/index.html'));
});

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send({ error: 'error'});
});

module.exports = {app: app, server: server};
