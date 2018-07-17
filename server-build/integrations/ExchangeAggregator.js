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

var availableExchanges = require('./availableExchanges.js');

var ExchangeAggregator = function () {
  function ExchangeAggregator(exchanges) {
    var _this = this;

    _classCallCheck(this, ExchangeAggregator);

    console.log("What are exchanges: ", exchanges);
    this.subscriptions = {};
    this.exchanges = [];
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
    value: function subscribeToOrderBooks(callback) {
      var _this2 = this;

      console.log("Subscribing callback");
      var boundCallback = callback.bind(this);
      this.exchanges.forEach(function (exchange) {
        return _this2.subscriptions[exchange].initOrderBook();
      });
      emitter.on('ORDER_BOOK_INIT', function (event) {
        _this2.mergeOrderBooks(event, boundCallback);
      });
      emitter.on('ORDER_UPDATE', function (event) {
        _this2.updateOrderBook(event);
      });
      setInterval(function () {
        var orderBookEvent = {
          type: 'ORDER_BOOK_INIT',
          orderBook: _this2.mergedOrderBook
        };
        boundCallback(JSON.stringify(orderBookEvent));
      }, 1000);
    }
  }, {
    key: 'mergeOrderBooks',
    value: function mergeOrderBooks(event, callback) {
      if (this.mergedOrderBook.bids) {
        var allBids = _extends({}, event.bids, this.mergedOrderBook.bids);
        var allBidRates = Object.keys(allBids);
        var orderBids = allBidRates.sort(function (a, b) {
          return allBids[b].rate - allBids[a].rate;
        });
        var bidBook = {};
        orderBids.forEach(function (bid) {
          bidBook[bid] = allBids[bid];
        });
        this.mergedOrderBook.bids = bidBook;
      } else {
        this.mergedOrderBook.bids = event.bids;
      };

      if (this.mergedOrderBook.asks) {
        var allAsks = _extends({}, event.asks, this.mergedOrderBook.asks);
        var allAskRates = Object.keys(allAsks);
        var orderAsks = allAskRates.sort(function (a, b) {
          return allAsks[a].rate - allAsks[b].rate;
        });
        var askBook = {};
        orderAsks.forEach(function (ask) {
          askBook[ask] = allAsks[ask];
        });
        this.mergedOrderBook.asks = askBook;
      } else {
        this.mergedOrderBook.asks = event.asks;
      };

      var orderBookEvent = {
        type: 'ORDER_BOOK_INIT',
        orderBook: this.mergedOrderBook
      };

      callback(JSON.stringify(orderBookEvent));
    }

    // Will use this same logic in React. Provide both backend & frontend orderbook

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