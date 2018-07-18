const assert = require('assert');
const Bittrex = require('../Bittrex');

beforeEach(() => {
  console.log("Testing tests?");
});

describe('Bittrex integration tests', () => {
  it('Is working at all', () => {
    assert.equal(true, true);
  });
});

// {
//   type: 'BID_UPDATE',
//   rateString: 'bittrex0.0002',
//   rate: 0.002,
//   amount: 1000
// }

// {
//   type: 'ASK_UPDATE',
//   rateString: 'bittrex0.0003',
//   rate: 0.003,
//   amount: 1000
// }