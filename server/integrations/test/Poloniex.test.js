const assert = require('assert');
const Poloniex = require('../Poloniex')

describe('Poloniex integrations test', () => {
  const exchange = new Poloniex();

  const markets = { 'BTC_ETH': 0, 'BTC_OMG': 0}
  const bidDelta = JSON.stringify(['14', '379823752', [['o', 1, 0.0002, 1000]]]);
  const askDelta = JSON.stringify(['14', '273598723', [['o', 0, 0.0003, 1000]]]);

  const expectedMarkets = [{ market: 'BTC-ETH' }, { market: 'BTC-OMG' }];
  const expectedBidUpdate = {
    type: 'BID_UPDATE',
    rateString: 'poloniex0.0002',
    rate: 0.0002,
    amount: 1000
  };
  const expectedAskUpdate = {
    type: 'ASK_UPDATE',
    rateString: 'poloniex0.0003',
    rate: 0.0003,
    amount: 1000
  };

  it('Parse bids into correct structure', () => {
    let parsedMarkets;
    exchange.emitOrderBook = (res) => {
      console.log("Override emit orderbook");
      parsedMarkets = res;
    };
    exchange.parseOrderDelta(bidDelta);
    assert.deepEqual(parsedMarkets, expectedBidUpdate);
  });

  it('Parses asks into correct structure', () => {
    let parsedMarkets;
    exchange.emitOrderBook = (res) => {
      console.log("Override emit orderbook");
      parsedMarkets = res;
    };
    exchange.parseOrderDelta(askDelta);
    assert.deepEqual(parsedMarkets, expectedAskUpdate);
  });

  it('Parse markets matches correct structure', () => {
    const parsedMarkets = exchange.parseMarkets(markets);
    assert.deepEqual(parsedMarkets, expectedMarkets);
  });
});

