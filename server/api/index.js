const express = require('express');
const router = express.Router();
const { Exchange } = require('../integrations/Exchange');
const exchanges = require('../exchanges');
const ExchangeAggregator = require('../integrations/ExchangeAggregator');
const asyncMiddleware = require('../utils/asyncResolve');

router.get('/getMarkets', asyncMiddleware(async (req, res, next) => {
  const exchangeStrings = Object.keys(exchanges);
  console.log("Trying home");

  const promisedExchanges = exchangeStrings.map(async (exch) => {
    const exchange = new exchanges[exch]();
    return await exchange.getMarket();
  })
  Promise.all(promisedExchanges).then(markets => {
    let market1 = markets.filter(mkt => mkt[0].hasOwnProperty('logo'))[0];
    let market2 = markets.filter(mkt => !mkt[0].hasOwnProperty('logo'))[0];
    console.log("Market 1 : ", market1);
    const sharedMarkets = market1.filter(val1 => {
      return market2.some(val2 => {
        console.log("Shared check", val1, val2);
        return val1.market === val2.market;
      });
    });
    console.log("What is shared? ", sharedMarkets);
    res.json(sharedMarkets);
  })
}));

module.exports = router;
