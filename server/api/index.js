const express = require('express');
const router = express.Router();
const { Exchange } = require('../integrations/Exchange');
const ExchangeAggregator = require('../integrations/ExchangeAggregator');
const asyncMiddleware = require('../utils/asyncMiddleware');


router.get('/getMarkets/:exchange', asyncMiddleware(async function(req, res, next) {
  console.log("Trying home");
  const exchange = new Exchange(req.params.exchange);
  res.json(await exchange.getMarkets());
}));

router.get('/test', function(req, res, next) {
  console.log("Trying home");
  const requestedExchanges = ['poloniex', 'bittrex'];
  const exchangeAggregator = new ExchangeAggregator(requestedExchanges);
  exchangeAggregator.subscribeToOrderBooks();
  res.json({test: "test"});
});


module.exports = router;
