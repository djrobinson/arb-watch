const assert = require('assert');
const Bittrex = require('../Bittrex');


describe('Bittrex integration tests', () => {
  const exchange = new Bittrex();


  const orderDeltaBid = { Z: [{ R: 0.0002, Q: 1000 }], S: []};
  const orderDeltaAsk = { Z: [], S: [{ R: 0.0003, Q: 1000 }]};
  const markets = [{ MarketName: 'BTC-ETH', LogoUrl: 'test.com' }, { MarketName: 'BTC-OMG', LogoUrl: 'test.com' }]


  const expectedBidUpdate = {
    type: 'BID_UPDATE',
    rateString: 'bittrex0.0002',
    rate: 0.0002,
    amount: 1000
  };
  const expectedAskUpdate = {
    type: 'ASK_UPDATE',
    rateString: 'bittrex0.0003',
    rate: 0.0003,
    amount: 1000
  };
  const expectedMarkets = [{ market: 'BTC-ETH', logo: 'test.com' }, { market: 'BTC-OMG', logo: 'test.com' }];


  it('Parse bids into correct structure', () => {
    let parsedMarkets;
    exchange.emitOrderBook = (res) => {
      console.log("Override emit orderbook");
      parsedMarkets = res;
    };
    exchange.parseOrderDelta('ORDER_DELTA', orderDeltaBid);
    assert.deepEqual(parsedMarkets, expectedBidUpdate);
  });

  it('Parses asks into correct structure', () => {
    let parsedMarkets;
    exchange.emitOrderBook = (res) => {
      console.log("Override emit orderbook");
      parsedMarkets = res;
    };
    exchange.parseOrderDelta('ORDER_DELTA', orderDeltaAsk);
    assert.deepEqual(parsedMarkets, expectedAskUpdate);
  });


  it('Parse markets matches correct structure', () => {
    const parsedMarkets = exchange.parseMarkets(markets);
    assert.deepEqual(parsedMarkets, expectedMarkets);
  });
});

