const assert = require('assert');
const Bittrex = require('../Bittrex');


describe('Bittrex integration tests', () => {
  const exchange = new Bittrex();


  const orderDeltaBid = { Z: [{ R: 0.0002, Q: 1000 }], S: []};
  const orderDeltaAsk = { Z: [], S: [{ R: 0.0003, Q: 1000 }]};
  const initOrderbook = { Z: [{ R: 0.0002, Q: 1000 }, { R: 0.00015, Q: 1500 }], S: [{ R: 0.0003, Q: 1000 }, { R: 0.00035, Q: 1200 }]}
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
  const expectedInitMarket = {
    type: 'ORDER_BOOK_INIT',
    exchange: 'bittrex',
    bids: {
      'bittrex0.0002': {
        rate: 0.0002,
        amount: 1000,
        exchange: 'bittrex'
      },
      'bittrex0.00015': {
        rate: 0.00015,
        amount: 1500,
        exchange: 'bittrex'
      }
    },
    asks: {
      'bittrex0.0003': {
        rate: 0.0003,
        amount: 1000,
        exchange: 'bittrex'
      },
      'bittrex0.00035': {
        rate: 0.00035,
        amount: 1200,
        exchange: 'bittrex'
      }
    }
  }
  const expectedMarkets = [{ market: 'BTC-ETH', logo: 'test.com' }, { market: 'BTC-OMG', logo: 'test.com' }];

  it('Parses initial orderbook into correct structure', () => {
    let parsed;
    exchange.emitOrderBook = (res) => {
      console.log("Calling mocked emit orderbook");
      parsed = res;
    };
    exchange.parseOrderDelta('ORDER_BOOK_INIT', initOrderbook);
    assert.deepEqual(parsed, expectedInitMarket);
  });

  it('Parse bids into correct structure', () => {
    let parsedMarkets;
    exchange.emitOrderBook = (res) => {
      parsedMarkets = res;
    };
    exchange.parseOrderDelta('ORDER_DELTA', orderDeltaBid);
    assert.deepEqual(parsedMarkets, expectedBidUpdate);
  });

  it('Parses asks into correct structure', () => {
    let parsedMarkets;
    exchange.emitOrderBook = (res) => {
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

