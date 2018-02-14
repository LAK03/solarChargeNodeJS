// Allows us to use ES6 in our migrations and tests.
require('babel-register')

module.exports = {
  networks: {
    rinkeby: {
      host: '127.0.0.1',
      port: 8545,
      network_id: 4,
      gas: 4000000,
      from: '0x317ca22915dca364cd678577013318d1ea0256e7'
    }
  }
}
