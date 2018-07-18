'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
CLASS THAT INSTANTIATES MULTIPLE EXCHANGE OBJECTS AND CALLS THEIR
APIS CONCURRENTLY TO THEN RETURN THE VALUES IN A DICTIONARY SO FE
CAN DISPLAY COMBINED EXCHANGE INFORMATION
*/
var _require = require('./Exchange'),
    emitter = _require.emitter;

var availableExchanges = require('../exchanges');

var ExchangeAggregator = function () {
  function ExchangeAggregator(exchanges) {
    var _this = this;

    _classCallCheck(this, ExchangeAggregator);

    this.subscriptions = {};
    this.exchanges = [];
    this.highestBid;
    this.lowestAsk;
    this.mergedOrderBook = {
      asks: null,
      bids: null
    };
    if (exchanges.length) {
      exchanges.forEach(function (exchangeName) {
        _this.exchanges.push(exchangeName);
        var instantiatedExchange = new availableExchanges[exchangeName]();
        _this.subscriptions[exchangeName] = instantiatedExchange;
      });
    }
    console.log("Exchange agg");
  }

  _createClass(ExchangeAggregator, [{
    key: 'sendWebSocket',
    value: function sendWebSocket(msg) {
      console.log("What is socket msg ", msg);
    }
  }, {
    key: 'subscribeToOrderBooks',
    value: function subscribeToOrderBooks(market, callback) {
      var _this2 = this;

      console.log("Subscribing callback");
      var boundCallback = callback.bind(this);
      this.exchanges.forEach(function (exchange) {
        return _this2.subscriptions[exchange].initOrderBook(market);
      });
      emitter.on('ORDER_BOOK_INIT', function (event) {
        _this2.mergeOrderBooks(event, boundCallback);
      });
      emitter.on('ORDER_UPDATE', function (event) {
        _this2.updateOrderBook(event);
      });
      emitter.on('WS_ERROR', function (event) {
        boundCallback(JSON.stringify(event));
      });
      setInterval(function () {
        var orderBookEvent = {
          type: 'ORDER_BOOK_INIT',
          highestBid: _this2.highestBid,
          lowestAsk: _this2.lowestAsk,
          orderBook: _this2.mergedOrderBook
        };
        boundCallback(JSON.stringify(orderBookEvent));
      }, 1000);
    }
  }, {
    key: 'removeAllSubscriptions',
    value: function removeAllSubscriptions() {
      var _this3 = this;

      this.exchanges.forEach(function (exchange) {
        return _this3.subscriptions[exchange].stopOrderBook();
      });
    }
  }, {
    key: 'mergeOrderBooks',
    value: function mergeOrderBooks(event, callback) {
      if (this.mergedOrderBook.bids) {
        var allBids = _extends({}, event.bids, this.mergedOrderBook.bids);
        var allBidRates = Object.keys(allBids);
        var sortedBids = allBidRates.sort(function (a, b) {
          return allBids[b].rate - allBids[a].rate;
        });

        this.highestBid = allBids[sortedBids[0]].rate;
        var bidBook = {};
        sortedBids.forEach(function (bid) {
          bidBook[bid] = allBids[bid];
        });
        this.mergedOrderBook.bids = bidBook;
      } else {
        this.highestBid = event.bids[Object.keys(event.bids)[0]].rate;
        this.mergedOrderBook.bids = event.bids;
      };

      if (this.mergedOrderBook.asks) {
        var allAsks = _extends({}, event.asks, this.mergedOrderBook.asks);
        var allAskRates = Object.keys(allAsks);
        var sortedAsks = allAskRates.sort(function (a, b) {
          return allAsks[a].rate - allAsks[b].rate;
        });
        this.lowestAsk = allAsks[sortedAsks[0]].rate;
        var askBook = {};
        sortedAsks.forEach(function (ask) {
          askBook[ask] = allAsks[ask];
        });
        this.mergedOrderBook.asks = askBook;
      } else {
        this.lowestAsk = event.asks[Object.keys(event.asks)[0]].rate;
        this.mergedOrderBook.asks = event.asks;
      };

      var orderBookEvent = {
        type: 'ORDER_BOOK_INIT',
        exchange: event.exchange,
        highestBid: this.highestBid,
        lowestAsk: this.lowestAsk,
        orderBook: this.mergedOrderBook
      };

      callback(JSON.stringify(orderBookEvent));
    }
  }, {
    key: 'updateOrderBook',
    value: function updateOrderBook(event) {

      var book = {};
      var type = '';
      if (event.type === 'BID_UPDATE') {
        type = 'bids';
        book = this.mergedOrderBook.bids;
      }
      if (event.type === 'ASK_UPDATE') {
        type = 'asks';
        book = this.mergedOrderBook.asks;
      }
      if (book) {
        if (!event.amount) {

          if (book[event.rateString]) {
            delete book[event.rateString];
          }
          this.mergedOrderBook[type] = book;
        } else if (book[event.rateString]) {
          var order = {
            exchange: event.exchange,
            rate: event.rate,
            amount: event.amount
          };
          book[event.rateString] = order;
          this.mergedOrderBook[type] = book;
        } else {
          var _order = {
            exchange: event.exchange,
            rate: event.rate,
            amount: event.amount
          };
          book[event.rateString] = _order;
          var sortedBook = Object.keys(book).sort(function (a, b) {
            if (type === 'bids') {
              return book[b].rate - book[a].rate;
            }
            if (type === 'asks') {
              return book[a].rate - book[b].rate;
            }
          });
          if (type === 'bids') {
            this.highestBid = book[sortedBook[0]].rate;
          }
          if (type === 'asks') {
            this.lowestAsk = book[sortedBook[0]].rate;
          }
          var newBook = {};
          sortedBook.forEach(function (b) {
            newBook[b] = book[b];
          });
          this.mergedOrderBook[type] = newBook;
        }
      }
    }
  }]);

  return ExchangeAggregator;
}();

module.exports = ExchangeAggregator;