const SupplyChain = artifacts.require('./SupplyChain.sol');
const RBAC = artifacts.require('./RBAC.sol');

module.exports = (deployer) => {
    deployer.deploy(
        RBAC,
    );
    deployer.link(RBAC, SupplyChain);
    deployer.deploy(
        SupplyChain,
    );
};
