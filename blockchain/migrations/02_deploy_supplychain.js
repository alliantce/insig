
const RBAC = artifacts.require('./RBAC.sol');
const SupplyChain = artifacts.require('./SupplyChain.sol');
const Token = artifacts.require('./Token.sol');

module.exports = (deployer) => {
    deployer.deploy(
        RBAC,
    );

    deployer.link(RBAC, SupplyChain);
    deployer.deploy(
        SupplyChain,
    );

    deployer.deploy(SupplyChain).then(() => deployer.deploy(Token, SupplyChain.address));
};
