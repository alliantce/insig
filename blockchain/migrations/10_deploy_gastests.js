
const RBAC = artifacts.require('./RBAC.sol');
const RBAC_GasTest = artifacts.require('./test/RBAC_GasTest.sol');

module.exports = (deployer) => {
    deployer.deploy(
        RBAC,
    );

    deployer.link(RBAC, RBAC_GasTest);
    deployer.deploy(
        RBAC_GasTest,
    );
};
