import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = {markets: []}

  componentDidMount() {
    fetch('/api/getMarkets/bittrex')
      .then(res => res.json())
      .then(data => {
        console.log("howdy! ", data);
        this.setState({ markets: data.result })
      });

    const socket = new WebSocket('ws://localhost:3001/api/echo');

    console.log("What is socket: ", socket);

    socket.onopen = (event) => {
      console.log("Socket has opened");
      socket.send("Here's some text that the server is urgently awaiting!");
    };

    socket.onmessage = (message) => console.log("What is message: ", message);

  }

  handleData(data) {
    console.log("What is data: ", data);
  }

  render() {
    return (
      <div className="App">
        <h1>Markets</h1>
        {
          this.state.markets.map((market, i) => <ul key={i} ><img src={market.LogoUrl} height="25px" width="25px" />{market.MarketCurrency}/{market.BaseCurrency}</ul>)
        }

      </div>
    );
  }
}

export default App;