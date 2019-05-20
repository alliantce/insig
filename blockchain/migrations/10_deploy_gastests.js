
const RBAC = artifacts.require('./RBAC.sol');
const RBACGasTest = artifacts.require('./test/RBACGasTest.sol');

module.exports = (deployer) => {
    deployer.deploy(
        RBAC,
    );

    deployer.link(RBAC, RBACGasTest);
    deployer.deploy(
        RBACGasTest,
    );
};
