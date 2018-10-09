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

const markets = ['ETH-LTC', 'BTC-LTC']

let AltToEth = {}
let AltToBtc = {}
let BtcToEth = {}
let currentBalances = {}
let pendingBuy = false
let pendingSell = false
let openBuys = []
let openSells = []
let updateIterator = 0
let marketInfo = {}

const initialize = async () => {
  log.bright.green ('Staring \'er up!')
  getBalances()
  const marketArray = await exchange.fetchMarkets()
  marketInfo = marketArray.reduce((acc, market) => {
    acc[market.id] = market
    return acc
  }, {})
  log.blue("MARKETS: ", marketInfo['BTC-ETH'])
  const main = new Bittrex()
  main.initOrderBook('BTC-ETH')
  setTimeout(() => {
    markets.forEach(market => {
      const starter = new Bittrex()
      starter.initOrderBook(market)
    })
  }, 2000)
  emitter.on('ORDER_BOOK_INIT', initialBook)
  emitter.on('ORDER_UPDATE', updateOrderBook)
}

const runStrategy = async (event) => {
    // TODO: NEED TO DO THIS BASED OFF "-". SOME ACRONYMS ARE 4 CHAR
    const base = event.market.slice(0, 3)
    const alt = event.market.slice(-3)
    if (event.type === 'ORDER_BOOK_INIT') {

    }
    if (event.type === 'BID_UPDATE') {

      log.bgLightMagenta.bright.cyan(base, " BASE ORDER UPDATE #", updateIterator)
      const bidRate = masterBook[event.market].highestBid
      const fee = currentBalances[base].free * .0025
      const altAmount = (currentBalances[base].free - fee) / bidRate
      if (base === 'ETH') {

      }
      if (altAmount > marketInfo[event.market].limits.amount.min) {
        if (openBuys.length && bidRate) {
          console.log("We've got an update!!")
          // Clone and erase openBuys
          const buyOrders = openBuys.slice(0)
          openBuys = [];
          for (const buyOrder of buyOrders) {
            const cancelResponse = await cancelOrder(buyOrder.id)
            log.bright.red( "Cancel results: ", cancelResponse )
          }
          const orderResults = await createOrder(alt + '/' + base, 'limit', 'buy', altAmount, bidRate)
          log.bright.green( "Order results: ", orderResults )
        } else if (bidRate) {
          log.bright.darkGray(event)
          if (!pendingBuy) {
            pendingBuy = true
            const orderResults = await createOrder(alt + '/' + base, 'limit', 'buy', altAmount, bidRate)
            log.bright.green( "Order results: ", orderResults )
            pendingBuy = false
          }


        }
      }

      updateIterator++
    }
    if (event.type === 'ASK_UPDATE') {
      const sellAmount = currentBalances[alt].free * (1 - .0025)

      log.bgLightCyan.bright.magenta(alt, " ORDER UPDATE #", updateIterator)
      const askRate = masterBook[event.market].lowestAsk

      if (currentBalances[alt].free > marketInfo[event.market].limits.amount.min) {
        if (openSells.length && currentBalances[alt].free && askRate) {
          console.log("We've got an update!!")
          // Clone and erase openBuys
          const sellOrders = openSells.slice(0)
          openSells = [];
          for (const sellOrder of sellOrders) {
            const cancelResponse = await cancelOrder(sellOrder.id)
            log.bright.red( "Cancel results: ", cancelResponse )
          }
          const orderResults = await createOrder(alt + '/' + base, 'limit', 'sell', sellAmount, askRate)
          log.bright.green( "Order results: ", orderResults )
        } else if (currentBalances[alt].free && askRate) {
          log.bright.darkGray(event)
          const orderResults = await createOrder(alt + '/' + base, 'limit', 'sell', sellAmount, askRate)
          log.bright.green( "Order results: ", orderResults )
        }
      }
      updateIterator++
    }
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
      openBuys.push(response)
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