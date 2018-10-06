"use strict"

const Bittrex = require('../integrations/Bittrex')
const { emitter } = require('./Exchange')

const main = new Bittrex()

main.initOrderBook('BTC-ETH')


let masterBook = {
  bids: {},
  asks: {}
};

const markets = ['ETH-LTC', 'BTC-LTC', 'ETH-REP', 'BTC-REP', 'ETH-ZEC', 'BTC-ZEC', 'ETH-DASH', 'BTC-DASH']

// Pause 2 seconds until btc-eth connects
setTimeout(() => {
  markets.forEach(market => {
    const starter = new Bittrex()
    starter.initOrderBook(market)
  })
}, 2000)


// ----------------------------------------------------------------------------

const ccxt = require ('ccxt')
const log = require ('ololog').configure ({ locate: false })

// ----------------------------------------------------------------------------

const exchange = new ccxt.bittrex ({
    'apiKey': process.env.BITTREX_API_KEY,
    'secret': process.env.BITTREX_SECRET,
    'verbose': false, // set to true to see more debugging output
    'timeout': 60000,
    'enableRateLimit': true, // add this
})

// const getCurrencies = async (exchange) => {
//   const currencies = await exchange.fetchCurrencies()
//   console.log("Here is currency: ", currencies['REP']);
//   return currencies
// }

// const currencies = getCurrencies(exchange)


function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const marketStuff = async (firstAmount, firstRate, secondRate, firstType, secondType, pair1, pair2, COIN, coinToBtcRate) => {

  log.bright.blue("Calc Price: ", firstRate);

  // try to load markets first, retry on request timeouts until it succeeds:

  let balance
  let firstTradeValue
  let secondTradeValue
  while (true) {
    try {
      await exchange.loadMarkets ();
      break;
    } catch (e) {
        if (e instanceof ccxt.RequestTimeout)
            console.log (exchange.iso8601 (Date.now ()), e.constructor.name, e.message)
    }
  }

  try {
      // fetch account balance from the exchange
      balance = await exchange.fetchBalance()
      const freeBalance = balance.free[COIN]
      console.log("What is freebalance: ", freeBalance)
      if (!freeBalance) {
        console.log("No Balance for ", COIN);
        return
      }
      firstTradeValue = firstAmount < freeBalance ? firstAmount : freeBalance
      if (firstTradeValue * coinToBtcRate < .001) {
        console.log("Trade value is not large enough: ", pair1, firstType, firstTradeValue)
        return
      }
      if (firstType === 'sell') {
        secondTradeValue = firstTradeValue * firstRate
      } else {
        secondTradeValue = firstTradeValue / firstRate
      }

      console.log("WHAAAT IS TRADE VALS: ", firstTradeValue, secondTradeValue)
  } catch (e) {
      if (e instanceof ccxt.DDoSProtection || e.message.includes ('ECONNRESET')) {
          log.bright.yellow ('[DDoS Protection] ' + e.message)
      } else if (e instanceof ccxt.RequestTimeout) {
          log.bright.yellow ('[Request Timeout] ' + e.message)
      } else if (e instanceof ccxt.AuthenticationError) {
          log.bright.yellow ('[Authentication Error] ' + e.message)
      } else if (e instanceof ccxt.ExchangeNotAvailable) {
          log.bright.yellow ('[Exchange Not Available Error] ' + e.message)
      } else if (e instanceof ccxt.ExchangeError) {
          log.bright.yellow ('[Exchange Error] ' + e.message)
      } else if (e instanceof ccxt.NetworkError) {
          log.bright.yellow ('[Network Error] ' + e.message)
      } else {
          throw e
      }
  }

  let symbol = pair1
  let orderType = 'limit'
  let side = firstType
  let amount = firstTradeValue

  let price = firstRate

  let firstOrderId
  try {
    log.bright.yellow("First Order: ", symbol, side, price, amount)
    const response = await exchange.createOrder (symbol, orderType, side, amount, price)
    firstOrderId = response.id
    log.bright.magenta (response)
    log.bright.magenta ('Succeeded')
  } catch (e) {
    log.bright.magenta (symbol, side, exchange.iso8601 (Date.now ()), e.constructor.name, e.message)
    log.bright.magenta ('Failed')
  }

  symbol = pair2
  orderType = 'limit'
  side = secondType
  if (secondType === 'buy') {
    amount = secondTradeValue / secondRate
  } else {
    amount = secondTradeValue
  }
  price = secondRate

  let tradeIsOpen = true
  while (tradeIsOpen) {
    try {
      let orders = await exchange.fetchOrder(firstOrderId)
      tradeIsOpen = orders.info.IsOpen
      console.log("Whaaaat's status of first order: ", orders.info.IsOpen)
    } catch (e) {
      log.bright.magenta("Fetch orders error: ", e)
    }
  }

  try {
      log.bright.yellow("Second Order: ", symbol, side, price, amount)
      const responseTwo = await exchange.createOrder (symbol, orderType, side, amount, price)
      log.bright.magenta (responseTwo)
      log.bright.magenta ('Succeeded')

  } catch (e) {

      log.bright.magenta (symbol, side, exchange.iso8601 (Date.now()), e.constructor.name, e.message)
      log.bright.magenta ('Failed')

  }
}

let AltToEth = {}
let AltToBtc = {}
let BtcToEth = {}

const calculateArbitrage = (event) => {
  let ALT
  if (event.market === 'BTC-ETH') {
    ALT = '';
  } else {
    if (event.market.indexOf('BTC-') > -1) {
      ALT = event.market.replace('BTC-', '')
    }
    if (event.market.indexOf('ETH-') > -1) {
      ALT = event.market.replace('ETH-', '')
    }
  }
  console.log("What is alt: ", ALT);

  const bidsArray = Object.keys(event.bids)
  const asksArray = Object.keys(event.asks)

  console.log("Event pair: ", event.market)

  if (event.market === `BTC-${ALT}`) {
    AltToBtc[ALT] = {
      bid: {},
      ask: {}
    }
    AltToBtc[ALT].bid = event.bids[bidsArray[0]],
    AltToBtc[ALT].ask = event.asks[asksArray[0]]
  }

  if (event.market === 'BTC-ETH') {
    BtcToEth.bid = event.bids[bidsArray[0]],
    BtcToEth.ask = event.asks[asksArray[0]]
  }

  if (event.market === `ETH-${ALT}`) {
    AltToEth[ALT] = {
      bid: {},
      ask: {}
    }
    AltToEth[ALT].bid = event.bids[bidsArray[0]],
    AltToEth[ALT].ask = event.asks[asksArray[0]]
  }
  if (BtcToEth.hasOwnProperty('bid') && AltToBtc[ALT] && AltToEth[ALT] && AltToBtc[ALT].hasOwnProperty('bid') && AltToEth[ALT].hasOwnProperty('bid')) {

    // ALT => BTC => ETH
    // Synthetic AltToEth.bid
    const synthAltToEth = AltToBtc[ALT].bid.rate / BtcToEth.ask.rate
    // ALT => ETH => BTC
    // Synthetic AltToBtc.bid
    const synthAltToBtc = AltToEth[ALT].bid.rate * BtcToEth.bid.rate
    // ETH => BTC => ALT
    // Synthetic 1 / AltToEth.ask
    const synthBtcToAlt = 1 / BtcToEth.ask.rate / AltToEth[ALT].ask.rate
    // BTC => ETH => ALT
    // Synthetic 1 / AltToBtc.ask
    const synthEthToAlt = BtcToEth.bid.rate / AltToBtc[ALT].ask.rate


    const altToEthProfit = ( synthAltToEth - AltToEth[ALT].bid.rate ) / AltToEth[ALT].bid.rate * 100 - 0.25
    const altToBtcProfit = ( synthAltToBtc - AltToBtc[ALT].bid.rate ) / AltToBtc[ALT].bid.rate * 100 - 0.25
    const btcToAltProfit = ( synthBtcToAlt -  1 / AltToBtc[ALT].ask.rate) / AltToBtc[ALT].ask.rate * 100 - 0.25
    const ethToAltProfit = ( synthEthToAlt - 1 / AltToEth[ALT].ask.rate) / AltToEth[ALT].ask.rate * 100 - 0.25


    if (altToEthProfit > 0) {
      // Synthetic ALT-BTC
      marketStuff(AltToBtc[ALT].bid.amount, AltToBtc[ALT].bid.rate, BtcToEth.ask.rate, 'sell', 'buy', ALT + '/BTC', 'ETH/BTC', ALT, AltToBtc[ALT].ask.rate)
    }

    if (altToBtcProfit > 0) {
      // Synthetic ALT-ETH
      marketStuff(AltToBtc[ALT].bid.amount, AltToEth[ALT].bid.rate, BtcToEth.bid.rate, 'sell', 'sell', ALT + '/ETH', 'ETH/BTC', ALT, AltToBtc[ALT].ask.rate)
    }

    if (btcToAltProfit > 0) {
      // Synthetic BTC-ALT
      marketStuff(BtcToEth.ask.amount, BtcToEth.ask.rate, AltToEth[ALT].ask.rate, 'buy', 'buy', 'ETH/BTC', ALT + '/ETH', 'BTC', AltToBtc[ALT].ask.rate)
    }

    if (ethToAltProfit > 0) {
      // Synthetic ETH-ALT
      marketStuff(BtcToEth.bid.amount, BtcToEth.bid.rate, AltToBtc[ALT].ask.rate, 'sell', 'buy', 'ETH/BTC', ALT + '/BTC', 'ETH', AltToBtc[ALT].ask.rate)
    }

    console.log("Synthetic ALT-BTC: ", synthAltToBtc, "Real: ", AltToBtc[ALT].bid.rate, "Arbitrage: ", altToBtcProfit)
    console.log("Synthetic ALT-ETH: ", synthAltToEth, "Real: ", AltToEth[ALT].bid.rate, "Arbitrage: ", altToEthProfit)
  }

}

emitter.on('ORDER_BOOK_INIT', calculateArbitrage)
// emitter.on('ORDER_UPDATE', updateOrderBook)

const updateOrderBook = (event) => {
  const market = event.market

  let book = {};
  let type = '';
  if (event.type === 'BID_UPDATE') {
    type = 'bids';
    book = masterBook[market].bids;
  }
  if (event.type === 'ASK_UPDATE') {
    type = 'asks';
    book = masterBook[market].asks;
  }
  if (book) {
    if (!event.amount) {

      if (book[event.rateString]) {
        delete book[event.rateString];
      }
      masterBook[market][type] = book;
    } else if (book[event.rateString]) {
      let order = {
        exchange: event.exchange,
        rate: event.rate,
        amount: event.amount
      };
      book[event.rateString] = order;
      masterBook[market][type] = book;
    } else {
      let order = {
        exchange: event.exchange,
        rate: event.rate,
        amount: event.amount
      };
      book[event.rateString] = order;
      const sortedBook = Object.keys(book).sort((a, b) => {
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
      const newBook = {};
      sortedBook.forEach(b => {
        newBook[b] = book[b];
      })
      masterBook[market][type] = newBook;
    }
  }
}

