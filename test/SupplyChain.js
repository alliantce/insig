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
    const creator = accounts[0];
    const user = accounts[1];

    before(async () => {
        supplyChain = await SupplyChain.deployed();
    });

    describe('Actions', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();
        });

        it('newAction creates a action.', async () => {
            productCreationDescription = 'Product line created.';

            transaction = await supplyChain.newAction(productCreationDescription, { from: creator });
            // console.log("Cost: $" + transaction.receipt.gasUsed / 3500000);

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, 'ActionCreated');
            assert.equal(transaction.logs[0].args.action.toNumber(), 0);

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
            transaction = await supplyChain.newAction(itemCreationDescription, { from: creator });

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, 'ActionCreated');
            assert.equal(transaction.logs[0].args.action.toNumber(), 1);

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

    describe('Steps', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();

            productCreationDescription = 'Product line created.';
            transaction = await supplyChain.newAction(productCreationDescription);
            productCreationAction = transaction.logs[0].args.action;

            itemCreationDescription = 'Instance created.';
            transaction = await supplyChain.newAction(itemCreationDescription);
            itemCreationAction = transaction.logs[0].args.action;

            certificationCreationDescription = 'Certification created';
            transaction = await supplyChain.newAction(certificationCreationDescription);
            certificationCreationAction = transaction.logs[0].args.action;

            // itemCertificationDescription = 'Instance certified';
            transaction = await supplyChain.newAction(certificationCreationDescription);
            itemCertificationAction = transaction.logs[0].args.action;
        });

        it('newStep creates a step.', async () => {
            const productZero = 100;
            const productOne = 101;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(productCreationAction, productOne, [])
            ).logs[0].args.step;

            assert.equal(stepZero, 0);
            assert.equal(stepOne, 1);
        });

        it('newStep creates chains.', async () => {
            const productZero = 100;
            const itemZero = 200;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero])
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(itemCertificationAction, itemZero, [stepOne])
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getPrecedents(stepOne))[0].toNumber(),
                stepZero.toNumber(),
            );
            assert.equal(
                (await supplyChain.getPrecedents(stepTwo))[0].toNumber(),
                stepOne.toNumber(),
            );
        });

        it('newStep maintains lastSteps.', async () => {
            const itemZero = 200;

            const stepZero = (
                await supplyChain.newStep(itemCreationAction, itemZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero])
            ).logs[0].args.step;

            assert.isFalse(
                (await supplyChain.isLastStep(10))
            );
            assert.isFalse(
                (await supplyChain.isLastStep(stepZero))
            );
            assert.isTrue(
                (await supplyChain.isLastStep(stepOne))
            );
        });

        itShouldThrow(
            'append only on last steps',
            async () => {    
                const itemZero = 100;
    
                const stepZero = (
                    await supplyChain.newStep(itemCreationAction, itemZero, [])
                ).logs[0].args.step;
                const stepOne = (
                    await supplyChain.newStep(itemCertificationAction, itemZero, [stepZero])
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.newStep(itemCertificationAction, itemZero, [stepZero])
                ).logs[0].args.step;
            },
            'Append only on last steps.',
        );

        it('newStep allows multiple precedents.', async () => {
            const partZero = 200;
            const partOne = 201;
            const itemZero = 202;

            const stepZero = (
                await supplyChain.newStep(itemCreationAction, partZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, partOne, [])
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero, stepOne])
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getPrecedents(stepTwo))[0].toNumber(),
                stepZero.toNumber(),
            );
            assert.equal(
                (await supplyChain.getPrecedents(stepTwo))[1].toNumber(),
                stepOne.toNumber(),
            );
        });

        itShouldThrow(
            'item must be unique or the same as a direct precedent.',
            async () => {    
                const itemZero = 100;
    
                const stepZero = (
                    await supplyChain.newStep(itemCreationAction, itemZero, [])
                ).logs[0].args.step;
                const stepOne = (
                    await supplyChain.newStep(itemCertificationAction, itemZero, [stepZero])
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.newStep(itemCreationAction, itemZero, [])
                ).logs[0].args.step;
            },
            'Instance not valid.',
        );

        it('newStep records step creator.', async () => {
            const productZero = 100;
            const itemZero = 200;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero])
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(itemCertificationAction, itemZero, [stepOne], { from: user })
            ).logs[0].args.step;
            const certifier = (await supplyChain.steps.call(stepTwo)).creator;

            assert.equal(certifier, user);
        });

        it('newStep records action.', async () => {
            const productZero = 100;
            const itemZero = 200;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero])
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.steps.call(stepZero)).action).toNumber(),
                productCreationAction.toNumber(),
            );
            assert.equal(
                ((await supplyChain.steps.call(stepOne)).action).toNumber(),
                itemCreationAction.toNumber(),
            );
        });

        it('newStep records item.', async () => {
            const productZero = 100;
            const itemZero = 200;
            const certificationZero = 300;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero])
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(certificationCreationAction, certificationZero, [])
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.newStep(itemCertificationAction, itemZero, [stepOne, stepTwo])
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.steps.call(stepZero)).item).toNumber(),
                productZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepOne)).item).toNumber(),
                itemZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepTwo)).item).toNumber(),
                certificationZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepThree)).item).toNumber(),
                itemZero,
            );
        });

        it('lastSteps records item.', async () => {
            const productZero = 100;
            const itemZero = 200;
            const certificationZero = 300;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero])
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(certificationCreationAction, certificationZero, [])
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.newStep(itemCertificationAction, itemZero, [stepOne, stepTwo])
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.lastSteps.call(productZero))).toNumber(),
                stepZero,
            );
            assert.equal(
                ((await supplyChain.lastSteps.call(itemZero))).toNumber(),
                stepThree,
            );
            assert.equal(
                ((await supplyChain.lastSteps.call(certificationZero))).toNumber(),
                stepTwo,
            );
        });
    });
});
