const assert = require('assert');
const Poloniex = require('../Poloniex')

// let exchange;

// beforeEach(() => {

//   console.log("Testing tests?");
// });

describe('Poloniex integrations test', () => {
  const exchange = new Poloniex();
  const markets = { 'BTC_ETH': 0, 'BTC_OMG': 0}
  const parsedMarkets = exchange.parseMarkets(markets);
  const expectedMarkets = [{ market: 'BTC-ETH' }, { market: 'BTC-OMG' }];
  it('Parse markets matches correct structure', () => {
    assert.deepEqual(parsedMarkets, expectedMarkets);
  });
});


// INIT OBJECT
// data[2][0][1].orderBook[1]

// UPDATE OBJECT
// data[2]

// {
//   type: 'BID_UPDATE',
//   rateString: 'poloniex0.0002',
//   rate: 0.002,
//   amount: 1000
// }

// {
//   type: 'ASK_UPDATE',
//   rateString: 'poloniex0.0003',
//   rate: 0.003,
//   amount: 1000
// }