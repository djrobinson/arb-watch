var express = require('express');
var router = express.Router();
var Exchange = require('../integrations/Exchange')
const asyncMiddleware = require('../utils/asyncMiddleware');


router.get('/getMarkets/:exchange', asyncMiddleware(async function(req, res, next) {
  console.log("Trying home");
  const exchange = new Exchange(req.params.exchange);
  res.json(await exchange.getMarkets());
}));


module.exports = router;
