import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import openSocket from 'socket.io-client';
import './OrderBook.css';

class OrderBook extends Component {
  state = {
    bids: {},
    asks: {}
  }

  socket = null;

  componentDidMount() {
    this.startSocket();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.market !== this.props.market) {
      this.startSocket();
    }
  }

  componentWillUnmount() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  startSocket() {
    const market = this.props.market;
    if (this.socket) {
      console.log("Disconnecting socket first");
      this.socket.emit('end');
    }
    // this.socket = openSocket('http://localhost:3001');
    // Bring this link out
    const socket = openSocket();

    this.socket.emit('startMarket', { market });

    this.socket.on('orderbook', (message) => {
      let data = JSON.parse(message);
      if (data.type === 'ORDER_BOOK_INIT') {
        this.setState({
          bids: data.orderBook.bids,
          asks: data.orderBook.asks
        })
      }
    });
  }

  updateOrderBook(event) {
    if (event.type === 'BID_UPDATE') {
      const book = this.state.bids;
      if (!event.amount) {
        if (book[event.rateString]) {
          delete book[event.rateString];
        }
        this.setState({ bids: book })
      } else {
        let order = {
          exchange: event.exchange,
          rate: event.rate,
          amount: event.amount
        };
        book[event.rateString] = order;
        this.setState({ bids: book })

      }
    }
    if (event.type === 'ASK_UPDATE') {
      const book = this.state.asks;
      if (!event.amount) {
        if (book[event.rateString]) {
          delete book[event.rateString];
        }
        this.setState({ asks: book })
      } else {
        let order = {
          exchange: event.exchange,
          rate: event.rate,
          amount: event.amount
        };
        book[event.rateString] = order;
        this.setState({ asks: book })

      }
    }


  }


  render() {
    return (
      <div className="OrderBook">
        <h1>{this.props.market} Order Book</h1>
        <Row>
          <Col md={6}>
            <h2>Bids</h2>
            <Row className="title-row">
              <Col md={3}><span>Currency Pair</span></Col>
              <Col md={3}><span>Exchange</span></Col>
              <Col md={3}><span>Order Size</span></Col>
              <Col md={3}><span>Bid Rate</span></Col>
            </Row>

            { (Object.keys(this.state.bids).length) &&
              Object.keys(this.state.bids).map((bid, i) => {
                return (
                  <Row key={i} className={this.state.bids[bid].exchange +" order-row bid-row"}>
                    <Col md={3}><span>{this.props.market}</span></Col>
                    <Col md={3}><span className="exchange-name">{this.state.bids[bid].exchange}</span></Col>
                    <Col md={3}><span>{this.state.bids[bid].amount}</span></Col>
                    <Col md={3}><span>{this.state.bids[bid].rate}</span></Col>
                  </Row>

                );
              })
            }
          </Col>
          <Col md={6}>
            <h2>Asks</h2>
            <Row className="title-row">
              <Col md={3}><span>Ask Rate</span></Col>
              <Col md={3}><span>Order Size</span></Col>
              <Col md={3}><span>Exchange</span></Col>
              <Col md={3}><span>Currency Pair</span></Col>
            </Row>
            {
              (Object.keys(this.state.asks).length) &&
              Object.keys(this.state.asks).map((ask, i) => {
                return (
                  <Row key={i} className={this.state.asks[ask].exchange +" order-row ask-row"}>
                    <Col md={3}><span>{this.state.asks[ask].rate}</span></Col>
                    <Col md={3}><span>{this.state.asks[ask].amount}</span></Col>
                    <Col md={3}><span className="exchange-name">{this.state.asks[ask].exchange}</span></Col>
                    <Col md={3}><span>{this.props.market}</span></Col>
                  </Row>
                );
              })
            }
          </Col>
        </Row>
      </div>
    );
  }
}

export default OrderBook;