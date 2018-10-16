"use strict"

const Bittrex = require('../integrations/Bittrex')
const { emitter } = require('./Exchange')
const ccxt = require ('ccxt')
const log = require ('ololog').configure ({ locate: false })


let masterBook = {}
let exchange = new ccxt.bittrex ({
    'apiKey': '',
    'secret': '',
    'verbose': false, // set to true to see more debugging output
    'timeout': 60000,
    'enableRateLimit': true, // add this
})

const markets = ['ETH-LTC']
const testMarket = 'ETH-LTC'

let currentBalances = {}
let pendingOrder = false
let openOrders = []
let iterator = 0
let marketInfo = {}

const initialize = async () => {
  getBalances()
  const marketArray = await exchange.fetchMarkets()
  marketInfo = marketArray.reduce((acc, market) => {
    acc[market.id] = market
    return acc
  }, {})
  const main = new Bittrex()
  main.initOrderBook('BTC-ETH')
  setTimeout(() => {
    markets.forEach(market => {
      const starter = new Bittrex()
      starter.initOrderBook(market)
    })
  }, 2000)
  // Pull in indicator object
  // Should have initialize and update methods
  //

  emitter.on('ORDER_BOOK_INIT', initialBook)
  emitter.on('ORDER_UPDATE', updateOrderBook)
}

const calculateAmount = (base, alt, side, rate) => {
  if (side === 'buy') {
    const fee = currentBalances[base].free * .0025
    const altAmount = (currentBalances[base].free - fee) / rate
    return altAmount
  }
  if (side === 'sell') {
    const fee = currentBalances[alt].free * .0025
    const baseAmount = (currentBalances[alt].free - fee) / rate
    return baseAmount
  }
}

const orderWorkflow = async (pair, side, rate) => {
  const base = pair.slice(0, pair.indexOf('-'))
  const alt = pair.slice(pair.length - pair.indexOf('-'), pair.length)
  console.log("What is BASE: ", base)
  console.log("What is ALT: ", alt)
  const amount = calculateAmount(base, alt, side, rate)
  if (openOrders.length && bidRate) {
    console.log("We've got an update!!")
    // Clone and erase openOrders
    const orders = openOrders.slice(0)
    openOrders = [];
    for (const order of orders) {
      const cancelResponse = await cancelOrder(order.id)
      log.bright.red( "Cancel results: ", cancelResponse )
    }

  }
  if (!pendingOrder) {
    pendingOrder = true
    const orderResults = await createOrder(alt + '/' + base, 'limit', side, amount, rate)
    pendingOrder = false
    return orderResults
  }
}


// TODO: REFORM EVENTS TO "INDICATOR_EVENT" INSTEAD OF MARKETBOOK EVENTS
const runStrategy = async () => {
  if (iterator % 10 === 0 && iterator !== 0) {
    const bidKeys = Object.keys(masterBook[testMarket].bids)
    console.log("Running strategy", bidKeys[4])
    const pair = testMarket
    const side = 'buy'
    const rate = masterBook[testMarket].bids[bidKeys[4]].rate
    const result = await orderWorkflow(pair, side, rate)
    log.bright.green( "Order result: ", result )
  }
  iterator++;


}

const getBalances = async () => {

  try {
      // fetch account balance from the exchange, save to global variable
      currentBalances = await exchange.fetchBalance()
      log.bright.lightGreen ( "Initial Balances: ", currentBalances )
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
}

const createOrder = async (symbol, orderType, side, amount, price) => {
  try {
    log.bright.yellow("First Order: ", symbol, side, price, amount)
    const response = await exchange.createOrder (symbol, orderType, side, amount, price)
    log.bright.magenta (response)
    if (response.side === 'buy') {
      openOrders.push(response)
    }
    if (response.side === 'sell') {
      openSells.push(response)
    }
    log.bright.magenta ('Succeeded')
    return response
  } catch (e) {
    log.bright.magenta (symbol, side, exchange.iso8601 (Date.now ()), e.constructor.name, e.message)
    log.bright.magenta ('Failed')
  }
}

const cancelOrder = async (id) => {
  try {
    const response = await exchange.cancelOrder(id)
    log.bright.magenta (response)
  } catch (e) {
    log.bright.magenta ('Cancel Failed')
  }
}

/*
  Strategies will all have an initial state and updates. The example below is
  the price action strategy. Might store each strategy in objects with

    initialize(event)
*/


const initialBook = (event) => {
  masterBook[event.market] = {}
  masterBook[event.market].bids = event.bids
  masterBook[event.market].asks = event.asks
  masterBook[event.market].highestBid = event.bids[Object.keys(event.bids)[0]].rate
  masterBook[event.market].lowestAsk = event.asks[Object.keys(event.asks)[0]].rate
  runStrategy(event)
}

const updateOrderBook = (event) => {
  const market = event.market

  let book = {}
  let type = ''
  let recalculate = false
  if (masterBook.hasOwnProperty(market)) {
    if (event.type === 'BID_UPDATE') {
      type = 'bids'
      book = masterBook[market].bids
    }
    if (event.type === 'ASK_UPDATE') {
      type = 'asks'
      book = masterBook[market].asks
    }
    if (book) {
      if (!event.amount) {

        if (book[event.rateString]) {
          delete book[event.rateString]
        }
        masterBook[market][type] = book
      } else if (book[event.rateString]) {
        let order = {
          exchange: event.exchange,
          rate: event.rate,
          amount: event.amount
        }
        book[event.rateString] = order
        masterBook[market][type] = book
      } else {
        let order = {
          exchange: event.exchange,
          rate: event.rate,
          amount: event.amount
        }
        book[event.rateString] = order
        const sortedBook = Object.keys(book).sort((a, b) => {
          if (type === 'bids') {
            return book[b].rate - book[a].rate
          }
          if (type === 'asks') {
            return book[a].rate - book[b].rate
          }
        })
        // Run strategy if there is a change in bid price
        if (type === 'bids') {
          if (book[sortedBook[0]].rate != masterBook[market].highestBid) {
            // Reset ask
            if (book[sortedBook[0]].rate > masterBook[market].highestBid) {
              masterBook[market].highestBid = book[sortedBook[0]].rate
            }
            recalculate = true
          }
        }
        // Run strategy if there is a change in ask price
        if (type === 'asks') {
          if (book[sortedBook[0]].rate != masterBook[market].lowestAsk) {
            // Reset bid
            if (book[sortedBook[0]].rate < masterBook[market].lowestAsk) {
              masterBook[market].lowestAsk = book[sortedBook[0]].rate
            }
            recalculate = true
          }
        }
        const newBook = {}
        sortedBook.forEach(b => {
          newBook[b] = book[b]
        })
        masterBook[market][type] = newBook
        if (recalculate) {
          runStrategy(event)
        }
      }
    }
  }
}

module.exports = {initialize}