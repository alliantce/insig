const SupplyChain = artifacts.require('./SupplyChain.sol');

const chai = require('chai');
const { itShouldThrow } = require('./utils');
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
    let transaction;
    const root = accounts[0];
    const operator1 = accounts[1];
    const operator2 = accounts[2];
    const owner1 = accounts[3];
    const owner2 = accounts[4];

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

    describe('Steps as a graph', () => {
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

            transaction = await supplyChain.addRootRole("OnlyRole");
            roleId = transaction.logs[0].args.role;
        });

        it('Creates steps.', async () => {
            const productZero = 100;
            const productOne = 101;

            const stepOne = (
                await supplyChain.pushStep(
                    productCreationAction,
                    productZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.pushStep(
                    itemCreationAction,
                    productOne,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;

            assert.equal(stepOne, 1);
            assert.equal(stepTwo, 2);

            assert.equal(
                (await supplyChain.totalSteps()).toNumber(),
                2
            );

            assert.equal(
                ((await supplyChain.steps.call(stepOne)).action).toNumber(),
                productCreationAction.toNumber(),
            );
            assert.equal(
                ((await supplyChain.steps.call(stepTwo)).action).toNumber(),
                itemCreationAction.toNumber(),
            );

            assert.equal(
                ((await supplyChain.steps.call(stepOne)).item).toNumber(),
                productZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepTwo)).item).toNumber(),
                productOne,
            );

            assert.equal((await supplyChain.steps.call(stepTwo)).creator, root);
        });

        it('Creates chains.', async () => {
            const itemZero = 100;

            const stepOne = (
                await supplyChain.pushStep(
                    productCreationAction,
                    itemZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.pushStep(
                    itemCreationAction,
                    itemZero,
                    [stepOne],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.pushStep(
                    itemCertificationAction,
                    itemZero,
                    [stepTwo],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getPrecedents(stepTwo))[0].toNumber(),
                stepOne,
            );
            assert.equal(
                (await supplyChain.getPrecedents(stepThree))[0].toNumber(),
                stepTwo,
            );
        });

        it('Multiple precedents.', async () => {
            const itemZero = 200;
            const itemOne = 201;

            const stepOne = (
                await supplyChain.pushStep(
                    itemCreationAction,
                    itemZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.pushStep(
                    itemCreationAction,
                    itemOne,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.pushStep(
                    itemCreationAction,
                    itemZero,
                    [stepOne, stepTwo],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getPrecedents(stepThree))[0].toNumber(),
                stepOne,
            );
            assert.equal(
                (await supplyChain.getPrecedents(stepThree))[1].toNumber(),
                stepTwo,
            );
        });

        it('pushSteps maintains lastSteps.', async () => {
            const itemZero = 200;
            const certificationZero = 300;

            const stepOne = (
                await supplyChain.pushStep(
                    productCreationAction,
                    itemZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.pushStep(
                    itemCreationAction,
                    itemZero,
                    [stepOne],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.pushStep(
                    certificationCreationAction,
                    certificationZero,
                    [],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;
            const stepFour = (
                await supplyChain.pushStep(
                    itemCertificationAction,
                    itemZero,
                    [stepTwo, stepThree],
                    0,
                    roleId,
                    roleId,
                )
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.lastSteps.call(itemZero))).toNumber(),
                stepFour,
            );
            assert.equal(
                ((await supplyChain.lastSteps.call(certificationZero))).toNumber(),
                stepThree,
            );
        });
    });
})
