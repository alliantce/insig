const SupplyChain = artifacts.require('./SupplyChain.sol');

const chai = require('chai');
const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('SupplyChain', (accounts) => {
    let supplyChain;
    // let productCreationAction;
    let productCreationDescription;
    let assetCreationAction;
    let assetCreationDescription;
    // let assetCertificationAction;
    let assetCertificationDescription;
    // let certificationCreationAction;
    let certificationCreationDescription;
    let transaction;
    const root = accounts[0];
    const operator1 = accounts[1];
    const operator2 = accounts[2];
    const owner1 = accounts[3];
    const owner2 = accounts[4];
    let rootRole;
    let operatorRole1;
    let ownerRole1;
    let operatorRole2;
    let ownerRole2;

    before(async () => {
        supplyChain = await SupplyChain.deployed();
    });

    describe('addRootState', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();

            productCreationDescription = 'Product line created.';
            transaction = await supplyChain.addAction(productCreationDescription);
            // productCreationAction = transaction.logs[0].args.action;

            assetCreationDescription = 'Instance created.';
            transaction = await supplyChain.addAction(assetCreationDescription);
            assetCreationAction = transaction.logs[0].args.action;

            certificationCreationDescription = 'Certification created';
            transaction = await supplyChain.addAction(certificationCreationDescription);
            // certificationCreationAction = transaction.logs[0].args.action;

            assetCertificationDescription = 'Instance certified';
            transaction = await supplyChain.addAction(assetCertificationDescription);
            // assetCertificationAction = transaction.logs[0].args.action;

            transaction = await supplyChain.addRootRole('Root', { from: root });
            rootRole = transaction.logs[0].args.role;

            transaction = await supplyChain.addRole('owner1', rootRole);
            ownerRole1 = transaction.logs[0].args.role;
            await supplyChain.addBearer(owner1, ownerRole1, { from: root });

            transaction = await supplyChain.addRole('operator1', ownerRole1);
            operatorRole1 = transaction.logs[0].args.role;
            await supplyChain.addBearer(operator1, operatorRole1, { from: owner1 });

            transaction = await supplyChain.addRole('owner2', rootRole);
            ownerRole2 = transaction.logs[0].args.role;
            await supplyChain.addBearer(owner2, ownerRole2, { from: root });

            transaction = await supplyChain.addRole('operator2', ownerRole2);
            operatorRole2 = transaction.logs[0].args.role;
            await supplyChain.addBearer(operator2, operatorRole2, { from: owner2 });
        });

        itShouldThrow(
            'addRootState - operator role must be provided.',
            async () => {
                await supplyChain.addRootState(
                    assetCreationAction,
                    0,
                    ownerRole1,
                    { from: owner1 },
                );
            },
            'An operator role is required.',
        );

        itShouldThrow(
            'addRootState - owner role must be provided.',
            async () => {
                await supplyChain.addRootState(
                    assetCreationAction,
                    operator1,
                    0,
                    { from: owner1 },
                );
            },
            'An owner role is required.',
        );

        // If there are no precedents check operator1 belongs to operators of the current state.
        itShouldThrow(
            'addRootState - operator must be owner for created state.',
            async () => {
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: operator1 },
                );
            },
            'Creator not in ownerRole.',
        );

        it('sanity check addRootState', async () => {
            await supplyChain.addBearer(operator1, operatorRole2, { from: owner2 });
            await supplyChain.addBearer(operator1, ownerRole2, { from: root });

            transaction = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            );
            const assetOne = transaction.logs[0].args.asset;
            const stateOne = transaction.logs[1].args.state;

            transaction = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole2,
                    ownerRole2,
                    { from: owner2 },
                )
            );
            const assetTwo = transaction.logs[0].args.asset;
            const stateTwo = transaction.logs[1].args.state;

            assert.equal(assetOne.toNumber(), 1);
            assert.equal(assetTwo.toNumber(), 2);

            assert.equal(stateOne.toNumber(), 1);
            assert.equal(stateTwo.toNumber(), 2);

            assert.equal(
                (await supplyChain.getPrecedents(stateOne)).length,
                0,
            );
            assert.equal(
                (await supplyChain.getPrecedents(stateOne)).length,
                0,
            );

            assert.equal(
                (await supplyChain.getPartOf(assetOne)).toNumber(),
                0,
            );
            assert.equal(
                (await supplyChain.getPartOf(assetTwo)).toNumber(),
                0,
            );

            assert.equal(
                (await supplyChain.getOperatorRole(assetOne)).toNumber(),
                operatorRole1,
            );
            assert.equal(
                (await supplyChain.getOperatorRole(assetTwo)).toNumber(),
                operatorRole2,
            );
            assert.equal(
                (await supplyChain.getOwnerRole(assetOne)).toNumber(),
                ownerRole1,
            );
            assert.equal(
                (await supplyChain.getOwnerRole(assetTwo)).toNumber(),
                ownerRole2,
            );
        });
    });
});
