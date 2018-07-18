'use strict';

var assert = require('assert');
var Poloniex = require('../Poloniex');

describe('Poloniex integrations test', function () {
  var exchange = new Poloniex();

  var markets = { 'BTC_ETH': 0, 'BTC_OMG': 0 };
  var bidDelta = JSON.stringify(['14', '379823752', [['o', 1, 0.0002, 1000]]]);
  var askDelta = JSON.stringify(['14', '273598723', [['o', 0, 0.0003, 1000]]]);
  var initBook = JSON.stringify(['14', '985923849', [['35', { orderBook: [{ '0.0003': '1000' }, { '0.0002': '2000' }] }]]]);

  var expectedMarkets = [{ market: 'BTC-ETH' }, { market: 'BTC-OMG' }];
  var expectedBidUpdate = {
    type: 'BID_UPDATE',
    rateString: 'poloniex0.0002',
    rate: 0.0002,
    amount: 1000
  };
  var expectedAskUpdate = {
    type: 'ASK_UPDATE',
    rateString: 'poloniex0.0003',
    rate: 0.0003,
    amount: 1000
  };
  var expectedInitMarket = {
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
  };

  it('Parses initial orderbook into correct structure', function () {
    var parsed = void 0;
    exchange.emitOrderBook = function (res) {
      console.log("Calling mocked emit orderbook");
      parsed = res;
    };
    exchange.parseOrderDelta(initBook);
    assert.deepEqual(parsed, expectedInitMarket);
  });

  it('Parse bids into correct structure', function () {
    var parsed = void 0;
    exchange.emitOrderBook = function (res) {
      parsed = res;
    };
    exchange.parseOrderDelta(bidDelta);
    assert.deepEqual(parsed, expectedBidUpdate);
  });

  it('Parses asks into correct structure', function () {
    var parsed = void 0;
    exchange.emitOrderBook = function (res) {
      parsed = res;
    };
    exchange.parseOrderDelta(askDelta);
    assert.deepEqual(parsed, expectedAskUpdate);
  });

  it('Parse markets matches correct structure', function () {
    var parsedMarkets = exchange.parseMarkets(markets);
    assert.deepEqual(parsedMarkets, expectedMarkets);
  });
});