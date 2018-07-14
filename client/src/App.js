import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = {test: []}

  componentDidMount() {
    fetch('/api/home')
      .then(res => res.json())
      .then(data => this.setState({...data}));
  }

  render() {
    return (
      <div className="App">
        <h1>Users</h1>
        {this.state.test}
      </div>
    );
  }
}

export default App;