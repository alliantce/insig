const SupplyChain = artifacts.require('./SupplyChain.sol');

const chai = require('chai');
const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('SupplyChain', (accounts) => {
    let supplyChain;
    // let productCreationAction;
    let productCreationDescription;
    let itemCreationAction;
    let itemCreationDescription;
    let itemCertificationAction;
    let itemCertificationDescription;
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

    describe('addInfoState', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();

            productCreationDescription = 'Product line created.';
            transaction = await supplyChain.addAction(productCreationDescription);
            // productCreationAction = transaction.logs[0].args.action;

            itemCreationDescription = 'Instance created.';
            transaction = await supplyChain.addAction(itemCreationDescription);
            itemCreationAction = transaction.logs[0].args.action;

            certificationCreationDescription = 'Certification created';
            transaction = await supplyChain.addAction(certificationCreationDescription);
            // certificationCreationAction = transaction.logs[0].args.action;

            itemCertificationDescription = 'Instance certified';
            transaction = await supplyChain.addAction(itemCertificationDescription);
            itemCertificationAction = transaction.logs[0].args.action;

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
            'Precedent items must exist.',
            async () => {
                const itemOne = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                await supplyChain.addInfoState(
                    itemCertificationAction,
                    itemOne,
                    [2],
                );
            },
            'Precedent item does not exist.',
        );

        itShouldThrow(
            'item must not be the same as a direct precedent.',
            async () => {
                const itemOne = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                await supplyChain.addInfoState(
                    itemCertificationAction,
                    itemOne,
                    [itemOne],
                );
            },
            'Item in precedents.',
        );

        itShouldThrow(
            'msg.sender not in operator role for one of the precedents.',
            async () => {
                const itemOne = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                const itemTwo = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                const itemThree = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole2,
                        ownerRole2,
                        { from: owner2 },
                    )
                ).logs[0].args.item;
                await supplyChain.addInfoState(
                    itemCertificationAction,
                    itemOne,
                    [itemTwo, itemThree],
                );
            },
            'Not an operator of precedents.',
        );

        it('sanity check addInfoState', async () => {
            await supplyChain.addBearer(operator1, operatorRole2, { from: owner2 });
            await supplyChain.addBearer(operator1, ownerRole2, { from: root });

            transaction = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            );
            const itemOne = transaction.logs[0].args.item;
            const stateOne = transaction.logs[1].args.state;

            transaction = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole2,
                    ownerRole2,
                    { from: owner2 },
                )
            );
            const itemTwo = transaction.logs[0].args.item;
            const stateTwo = transaction.logs[1].args.state;

            const stateThree = (
                await supplyChain.addInfoState(
                    itemCreationAction,
                    itemOne,
                    [itemTwo],
                    { from: operator1 },
                )
            ).logs[0].args.state;

            const stateFour = (
                await supplyChain.addInfoState(
                    itemCreationAction,
                    itemOne,
                    [],
                    { from: operator1 },
                )
            ).logs[0].args.state;

            assert.equal(itemOne.toNumber(), 1);
            assert.equal(itemTwo.toNumber(), 2);

            assert.equal(stateOne.toNumber(), 1);
            assert.equal(stateTwo.toNumber(), 2);
            assert.equal(stateThree.toNumber(), 3);
            assert.equal(stateFour.toNumber(), 4);

            assert.equal(
                (await supplyChain.getPrecedents(stateThree)).length,
                2,
            );
            assert.equal(
                (await supplyChain.getPrecedents(stateThree))[0].toNumber(),
                stateOne,
            );
            assert.equal(
                (await supplyChain.getPrecedents(stateThree))[1].toNumber(),
                stateTwo,
            );

            assert.equal(
                (await supplyChain.getPrecedents(stateFour)).length,
                1,
            );
            assert.equal(
                (await supplyChain.getPrecedents(stateFour))[0].toNumber(),
                stateThree,
            );

            assert.equal(
                (await supplyChain.getPartOf(itemOne)).toNumber(),
                0,
            );
            assert.equal(
                (await supplyChain.getPartOf(itemTwo)).toNumber(),
                0,
            );

            assert.equal(
                (await supplyChain.getOperatorRole(itemOne)).toNumber(),
                operatorRole1,
            );
            assert.equal(
                (await supplyChain.getOperatorRole(itemTwo)).toNumber(),
                operatorRole2,
            );
            assert.equal(
                (await supplyChain.getOwnerRole(itemOne)).toNumber(),
                ownerRole1,
            );
            assert.equal(
                (await supplyChain.getOwnerRole(itemTwo)).toNumber(),
                ownerRole2,
            );
        });
    });
});
