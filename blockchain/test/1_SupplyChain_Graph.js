const SupplyChain = artifacts.require('./SupplyChain.sol');

const chai = require('chai');
// const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('SupplyChain', (accounts) => {
    let supplyChain;
    let productCreationAction;
    let productCreationDescription;
    let assetCreationAction;
    let assetCreationDescription;
    let certificationCreationAction;
    let certificationCreationDescription;
    let assetCertificationAction;
    let assetCertificationDescription;
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

            assetCreationDescription = 'Instance';
            transaction = await supplyChain.addAction(assetCreationDescription, { from: root });

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, 'ActionCreated');
            assert.equal(transaction.logs[0].args.action.toNumber(), 2);

            assert.equal(
                await supplyChain.actionDescription(transaction.logs[0].args.action.toNumber()),
                assetCreationDescription,
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

            assetCreationDescription = 'Instance created.';
            transaction = await supplyChain.addAction(assetCreationDescription);
            assetCreationAction = transaction.logs[0].args.action;

            certificationCreationDescription = 'Certification created';
            transaction = await supplyChain.addAction(certificationCreationDescription);
            certificationCreationAction = transaction.logs[0].args.action;

            assetCertificationDescription = 'Instance certified';
            transaction = await supplyChain.addAction(assetCertificationDescription);
            assetCertificationAction = transaction.logs[0].args.action;

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
                    assetCreationAction,
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
                assetCreationAction.toNumber(),
            );

            assert.equal(
                ((await supplyChain.states.call(stateOne)).asset).toNumber(),
                productZero,
            );
            assert.equal(
                ((await supplyChain.states.call(stateTwo)).asset).toNumber(),
                productOne,
            );

            assert.equal((await supplyChain.states.call(stateTwo)).creator, root);
        });

        it('Creates chains.', async () => {
            const assetZero = 100;

            const stateOne = (
                await supplyChain.pushState(
                    productCreationAction,
                    assetZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateTwo = (
                await supplyChain.pushState(
                    assetCreationAction,
                    assetZero,
                    [stateOne],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateThree = (
                await supplyChain.pushState(
                    assetCertificationAction,
                    assetZero,
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
            const assetZero = 200;
            const assetOne = 201;

            const stateOne = (
                await supplyChain.pushState(
                    assetCreationAction,
                    assetZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateTwo = (
                await supplyChain.pushState(
                    assetCreationAction,
                    assetOne,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateThree = (
                await supplyChain.pushState(
                    assetCreationAction,
                    assetZero,
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
            const assetZero = 200;
            const certificationZero = 300;

            const stateOne = (
                await supplyChain.pushState(
                    productCreationAction,
                    assetZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;
            const stateTwo = (
                await supplyChain.pushState(
                    assetCreationAction,
                    assetZero,
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
                    assetCertificationAction,
                    assetZero,
                    [stateTwo, stateThree],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.state;

            assert.equal(
                ((await supplyChain.lastStates.call(assetZero))).toNumber(),
                stateFour,
            );
            assert.equal(
                ((await supplyChain.lastStates.call(certificationZero))).toNumber(),
                stateThree,
            );
        });
    });
});
