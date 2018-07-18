'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/
var signalR = require('signalr-client');
var jsonic = require('jsonic');
var zlib = require('zlib');
var events = require('events');

var _require = require('../base/Exchange'),
    Exchange = _require.Exchange;

var Bittrex = function (_Exchange) {
  _inherits(Bittrex, _Exchange);

  function Bittrex() {
    _classCallCheck(this, Bittrex);

    var _this = _possibleConstructorReturn(this, (Bittrex.__proto__ || Object.getPrototypeOf(Bittrex)).call(this));

    _this.exchangeName = 'bittrex';
    _this.marketsUrl = 'https://bittrex.com/api/v1.1/public/getmarkets';
    _this.client;
    console.log('Instantiating Bittrex exchange!');
    return _this;
  }

  _createClass(Bittrex, [{
    key: 'getMarket',
    value: function getMarket() {
      var markets, parsedMarkets;
      return regeneratorRuntime.async(function getMarket$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return regeneratorRuntime.awrap(this.get(this.marketsUrl));

            case 3:
              markets = _context.sent;
              parsedMarkets = this.parseMarkets(markets.result);
              return _context.abrupt('return', Promise.resolve(parsedMarkets));

            case 8:
              _context.prev = 8;
              _context.t0 = _context['catch'](0);
              return _context.abrupt('return', Promise.reject(_context.t0));

            case 11:
            case 'end':
              return _context.stop();
          }
        }
      }, null, this, [[0, 8]]);
    }
  }, {
    key: 'parseMarkets',
    value: function parseMarkets(raw) {
      return raw.map(function (mkt) {
        return {
          market: mkt.MarketName,
          logo: mkt.LogoUrl
        };
      });
    }
  }, {
    key: 'stopOrderBook',
    value: function stopOrderBook() {
      if (this.client) {
        console.log("Stopping bittrex ws");
        this.client.end();
      }
    }
  }, {
    key: 'initOrderBook',
    value: function initOrderBook(market) {
      var _this2 = this;

      console.log("Bittrex init order book");
      this.client = new signalR.client('wss://beta.bittrex.com/signalr', ['c2']);

      var self = this;
      var boundParser = this.parseOrderDelta.bind(this);
      var boundInitExchangeDelta = this.initExchangeDelta.bind(this);

      self.client.serviceHandlers.connected = function (connection) {
        console.log('connected');
        self.client.call('c2', 'QueryExchangeState', market).done(function (err, result) {
          if (err) {
            return console.log(err);
          }
          if (result === true) {
            console.log('Subscribed to ' + market);
          }
        });
      };

      self.client.serviceHandlers.connectFailed = function (err) {
        console.log("Bittrex Connect Failed", err);
      };

      self.client.serviceHandlers.onerror = function (err) {
        console.log("Bittrex WS Error", err);
        _this2.emitOrderBook({
          type: 'WS_ERROR',
          exchange: 'bittrex'
        });
      };

      self.client.serviceHandlers.onclose = function () {
        console.log("Bittrex Websocket close");
      };

      self.client.serviceHandlers.messageReceived = function (message) {
        var data = jsonic(message.utf8Data);
        var json = void 0;

        if (data.hasOwnProperty('R')) {
          var b64 = data.R;

          var raw = new Buffer.from(b64, 'base64');
          zlib.inflateRaw(raw, function (err, inflated) {
            if (!err) {
              var _json = JSON.parse(inflated.toString('utf8'));
              boundParser('ORDER_BOOK_INIT', _json);
              // Start only after order book inits
              boundInitExchangeDelta(market);
            }
          });
        }
      };
    }
  }, {
    key: 'initExchangeDelta',
    value: function initExchangeDelta(market) {
      console.log("Bittrex init order book");

      var self = this;
      var boundParser = this.parseOrderDelta.bind(this);

      self.client.call('c2', 'SubscribeToExchangeDeltas', market).done(function (err, result) {
        if (err) {
          return console.log(err);
        }
        if (result === true) {
          console.log('Subscribed to ' + market);
        }
      });

      self.client.serviceHandlers.messageReceived = function (message) {
        var data = jsonic(message.utf8Data);
        var json = void 0;
        if (data.hasOwnProperty('M')) {
          if (data.M[0]) {
            if (data.M[0].hasOwnProperty('A')) {
              if (data.M[0].A[0]) {
                /**
                 *  handling the GZip and base64 compression
                 *  https://github.com/Bittrex/beta#response-handling
                 */
                var b64 = data.M[0].A[0];
                var raw = new Buffer.from(b64, 'base64');

                zlib.inflateRaw(raw, function (err, inflated) {
                  if (!err) {
                    json = JSON.parse(inflated.toString('utf8'));
                    boundParser('ORDER_DELTA', json);
                  }
                });
              }
            }
          }
        }
      };
    }
  }, {
    key: 'parseOrderDelta',
    value: function parseOrderDelta(type, orderDelta) {
      var _this3 = this;

      if (type === 'ORDER_BOOK_INIT' && orderDelta['Z'] && orderDelta['S']) {
        var sortedBids = orderDelta['Z'].sort(function (a, b) {
          return b.R - a.R;
        }).slice(0, this.orderBookDepth);
        var sortedAsks = orderDelta['S'].sort(function (a, b) {
          return a.R - b.R;
        }).slice(0, this.orderBookDepth);
        var bids = sortedBids.reduce(function (aggregator, bid) {
          var order = {
            exchange: _this3.exchangeName,
            rate: bid.R,
            amount: parseFloat(bid.Q)
          };
          aggregator[_this3.exchangeName + bid.R.toString()] = order;
          return aggregator;
        }, {});
        var asks = sortedAsks.reduce(function (aggregator, ask) {
          var order = {
            exchange: _this3.exchangeName,
            rate: ask.R,
            amount: parseFloat(ask.Q)
          };
          aggregator[_this3.exchangeName + ask.R.toString()] = order;
          return aggregator;
        }, {});
        var initOrderBook = {
          type: type,
          exchange: this.exchangeName,
          bids: bids,
          asks: asks
        };
        this.emitOrderBook(initOrderBook);
      }
      if (type === 'ORDER_DELTA' && orderDelta['Z'] && orderDelta['S']) {
        orderDelta['Z'].forEach(function (change) {
          var orderDelta = {
            type: 'BID_UPDATE',
            rateString: _this3.exchangeName + change.R.toString(),
            rate: change.R,
            amount: parseFloat(change.Q)
          };
          _this3.emitOrderBook(orderDelta);
        });
        orderDelta['S'].forEach(function (change) {
          var orderDelta = {
            type: 'ASK_UPDATE',
            rateString: _this3.exchangeName + change.R.toString(),
            rate: change.R,
            amount: parseFloat(change.Q)
          };
          _this3.emitOrderBook(orderDelta);
        });
      }
    }
  }]);

  return Bittrex;
}(Exchange);

module.exports = Bittrex;