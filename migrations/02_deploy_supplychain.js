const SupplyChain = artifacts.require('./SupplyChain.sol');

module.exports = (deployer) => {
    deployer.deploy(
        SupplyChain,
    );
};
