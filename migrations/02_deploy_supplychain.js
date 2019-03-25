const BigNumber = require('bignumber.js');
const SupplyChain = artifacts.require('./SupplyChain.sol');

module.exports = function(deployer, network, accounts) {
    deployer.deploy(
        SupplyChain, 
    );
};
