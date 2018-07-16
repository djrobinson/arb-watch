import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = {markets: []}

  componentDidMount() {
    fetch('/api/getMarkets/bittrex')
      .then(res => res.json())
      .then(data => {
        this.setState({ markets: data.result })
      });

    // fetch('/api/test')
    //   .then(res => console.log("What's from test: ", res));

    const socket = new WebSocket('ws://localhost:3001/api/echo');

    console.log("What is socket: ", socket);

    socket.onopen = (event) => {
      console.log("Socket has opened");
    };

    socket.onmessage = (message) => console.log("What is message: ", JSON.parse(message.data));

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