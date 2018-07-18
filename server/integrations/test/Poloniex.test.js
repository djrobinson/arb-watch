const assert = require('assert');
const Poloniex = require('../Poloniex')

describe('Poloniex integrations test', () => {
  const exchange = new Poloniex();

  const markets = { 'BTC_ETH': 0, 'BTC_OMG': 0}
  const bidDelta = JSON.stringify(['14', '379823752', [['o', 1, 0.0002, 1000]]]);
  const askDelta = JSON.stringify(['14', '273598723', [['o', 0, 0.0003, 1000]]]);
  const initBook = JSON.stringify(['14', '985923849', [['35', { orderBook: [{'0.0003': '1000'}, {'0.0002': '2000'}]}]]])

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
  const expectedInitMarket = {
    type: 'ORDER_BOOK_INIT',
    bids: {
      'poloniex0.0002': {
        rate: 0.0002,
        amount: 2000,
        exchange: 'poloniex'
      }
    },
    asks: {
      'poloniex0.0003': {
        rate: 0.0003,
        amount: 1000,
        exchange: 'poloniex'
      }
    }
  }

  it('Parses initial orderbook into correct structure', () => {
    let parsed;
    exchange.emitOrderBook = (res) => {
      console.log("Override emit orderbook");
      parsed = res;
    };
    exchange.parseOrderDelta(initBook);
    assert.deepEqual(parsed, expectedInitMarket);
  })

  it('Parse bids into correct structure', () => {
    let parsed;
    exchange.emitOrderBook = (res) => {
      parsed = res;
    };
    exchange.parseOrderDelta(bidDelta);
    assert.deepEqual(parsed, expectedBidUpdate);
  });

  it('Parses asks into correct structure', () => {
    let parsed;
    exchange.emitOrderBook = (res) => {
      parsed = res;
    };
    exchange.parseOrderDelta(askDelta);
    assert.deepEqual(parsed, expectedAskUpdate);
  });

  it('Parse markets matches correct structure', () => {
    const parsedMarkets = exchange.parseMarkets(markets);
    assert.deepEqual(parsedMarkets, expectedMarkets);
  });
});

