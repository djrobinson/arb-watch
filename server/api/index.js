const express = require('express');
const router = express.Router();
const Exchange = require('../integrations/Exchange');
const ExchangeAggregator = require('../integrations/ExchangeAggregator');
const Poloniex = require('../integrations/Poloniex');
const Bittrex = require('../integrations/Bittrex');
const asyncMiddleware = require('../utils/asyncMiddleware');


router.get('/getMarkets/:exchange', asyncMiddleware(async function(req, res, next) {
  console.log("Trying home");
  const exchange = new Exchange(req.params.exchange);
  res.json(await exchange.getMarkets());
}));

router.get('/test', function(req, res, next) {
  console.log("Trying home");
  const bittrex = new Bittrex();
  bittrex.initOrderBook();
  res.json({test: "test"});
});

router.ws('/echo', function(ws, req) {
    console.log("Inside of ECHO");
    const aggregatorCallback = function(msg) {
      console.log("Inside aggregatorCallback", msg);
      ws.send(msg.pair);
    };

    // exchangeAggregator.subscribeToOrderBook(aggregatorCallback);

    ws.on('message', msg => {
        ws.send(msg)

    });

    ws.on('close', () => {
        console.log('WebSocket was closed')
    });
});

module.exports = router;
