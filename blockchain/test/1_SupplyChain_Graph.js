const SupplyChain = artifacts.require('./SupplyChain.sol');

const chai = require('chai');
// const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('SupplyChain', (accounts) => {
    let supplyChain;
    let productCreationAction;
    let productCreationDescription;
    let itemCreationAction;
    let itemCreationDescription;
    let certificationCreationAction;
    let certificationCreationDescription;
    let itemCertificationAction;
    let itemCertificationDescription;
    let roleId;
    let transaction;
    const root = accounts[0];

    before(async () => {
        supplyChain = await SupplyChain.deployed();
    });

    describe('Actions', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();
        });

        it('addAction creates a action.', async () => {
            productCreationDescription = 'Product line created.';

            transaction = await supplyChain.addAction(productCreationDescription, { from: root });

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, 'ActionCreated');
            assert.equal(transaction.logs[0].args.action.toNumber(), 1);

            assert.equal(
                await supplyChain.actionDescription(transaction.logs[0].args.action.toNumber()),
                productCreationDescription,
            );
            let totalActions = (await supplyChain.totalActions()).toNumber();
            assert.equal(
                totalActions,
                1,
            );

            itemCreationDescription = 'Instance';
            transaction = await supplyChain.addAction(itemCreationDescription, { from: root });

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, 'ActionCreated');
            assert.equal(transaction.logs[0].args.action.toNumber(), 2);

            assert.equal(
                await supplyChain.actionDescription(transaction.logs[0].args.action.toNumber()),
                itemCreationDescription,
            );
            totalActions = (await supplyChain.totalActions()).toNumber();
            assert.equal(
                totalActions,
                2,
            );
        });
    });

    describe('States as a graph', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();

            productCreationDescription = 'Product line created.';
            transaction = await supplyChain.addAction(productCreationDescription);
            productCreationAction = transaction.logs[0].args.action;

            itemCreationDescription = 'Instance created.';
            transaction = await supplyChain.addAction(itemCreationDescription);
            itemCreationAction = transaction.logs[0].args.action;

            certificationCreationDescription = 'Certification created';
            transaction = await supplyChain.addAction(certificationCreationDescription);
            certificationCreationAction = transaction.logs[0].args.action;

            itemCertificationDescription = 'Instance certified';
            transaction = await supplyChain.addAction(itemCertificationDescription);
            itemCertificationAction = transaction.logs[0].args.action;

            transaction = await supplyChain.addRootRole('OnlyRole');
            roleId = transaction.logs[0].args.role;
        });

        it('Creates states.', async () => {
            const productZero = 100;
            const productOne = 101;

            const stateOne = (
                await supplyChain.pushState(
                    productCreationAction,
                    productZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateTwo = (
                await supplyChain.pushState(
                    itemCreationAction,
                    productOne,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;

            assert.equal(stateOne, 1);
            assert.equal(stateTwo, 2);

            assert.equal(
                (await supplyChain.totalStates()).toNumber(),
                2,
            );

            assert.equal(
                ((await supplyChain.states.call(stateOne)).action).toNumber(),
                productCreationAction.toNumber(),
            );
            assert.equal(
                ((await supplyChain.states.call(stateTwo)).action).toNumber(),
                itemCreationAction.toNumber(),
            );

            assert.equal(
                ((await supplyChain.states.call(stateOne)).item).toNumber(),
                productZero,
            );
            assert.equal(
                ((await supplyChain.states.call(stateTwo)).item).toNumber(),
                productOne,
            );

            assert.equal((await supplyChain.states.call(stateTwo)).creator, root);
        });

        it('Creates chains.', async () => {
            const itemZero = 100;

            const stateOne = (
                await supplyChain.pushState(
                    productCreationAction,
                    itemZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateTwo = (
                await supplyChain.pushState(
                    itemCreationAction,
                    itemZero,
                    [stateOne],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateThree = (
                await supplyChain.pushState(
                    itemCertificationAction,
                    itemZero,
                    [stateTwo],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;

            assert.equal(
                (await supplyChain.getPrecedents(stateTwo))[0].toNumber(),
                stateOne,
            );
            assert.equal(
                (await supplyChain.getPrecedents(stateThree))[0].toNumber(),
                stateTwo,
            );
        });

        it('Multiple precedents.', async () => {
            const itemZero = 200;
            const itemOne = 201;

            const stateOne = (
                await supplyChain.pushState(
                    itemCreationAction,
                    itemZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateTwo = (
                await supplyChain.pushState(
                    itemCreationAction,
                    itemOne,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateThree = (
                await supplyChain.pushState(
                    itemCreationAction,
                    itemZero,
                    [stateOne, stateTwo],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;

            assert.equal(
                (await supplyChain.getPrecedents(stateThree))[0].toNumber(),
                stateOne,
            );
            assert.equal(
                (await supplyChain.getPrecedents(stateThree))[1].toNumber(),
                stateTwo,
            );
        });

        it('pushStates maintains lastStates.', async () => {
            const itemZero = 200;
            const certificationZero = 300;

            const stateOne = (
                await supplyChain.pushState(
                    productCreationAction,
                    itemZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateTwo = (
                await supplyChain.pushState(
                    itemCreationAction,
                    itemZero,
                    [stateOne],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateThree = (
                await supplyChain.pushState(
                    certificationCreationAction,
                    certificationZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateFour = (
                await supplyChain.pushState(
                    itemCertificationAction,
                    itemZero,
                    [stateTwo, stateThree],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;

            assert.equal(
                ((await supplyChain.lastStates.call(itemZero))).toNumber(),
                stateFour,
            );
            assert.equal(
                ((await supplyChain.lastStates.call(certificationZero))).toNumber(),
                stateThree,
            );
        });
    });
});
