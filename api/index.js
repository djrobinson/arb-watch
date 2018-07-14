var express = require('express');
var router = express.Router();
var Exchange = require('../integrations/Exchange')

/* GET users listing. */
router.get('/home', function(req, res, next) {
  // Comment out this line:
  //res.send('respond with a resource');
  console.log("Trying home");
  // And insert something like this instead:
  const newExchange = new Exchange('bittrex');
  console.log("testing: ", newExchange);
  res.json({
    test: "test"
  });
});


module.exports = router;
