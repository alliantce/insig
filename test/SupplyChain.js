const SupplyChain = artifacts.require('./SupplyChain.sol');

const chai = require('chai');
const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('SupplyChain', (accounts) => {
    let supplyChain;
    let productCreationClass;
    let productCreationDescription;
    let instanceCreationClass;
    let instanceCreationDescription;
    let certificationCreationClass;
    let certificationCreationDescription;
    let instanceCertificationClass;
    let transaction;
    const owner = accounts[0];
    const user = accounts[1];

    before(async () => {
        supplyChain = await SupplyChain.deployed();
    });

    describe('Classes', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();
        });

        it('newClass creates a class.', async () => {
            productCreationDescription = 'Product line created.';

            transaction = await supplyChain.newClass(productCreationDescription, { from: owner });
            // console.log("Cost: $" + transaction.receipt.gasUsed / 3500000);

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, 'ClassCreated');
            assert.equal(transaction.logs[0].args.class.toNumber(), 0);

            assert.equal(
                await supplyChain.classDescription(transaction.logs[0].args.class.toNumber()),
                productCreationDescription,
            );
            let totalClasses = (await supplyChain.totalClasses()).toNumber();
            assert.equal(
                totalClasses,
                1,
            );

            instanceCreationDescription = 'Instance';
            transaction = await supplyChain.newClass(instanceCreationDescription, { from: owner });

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, 'ClassCreated');
            assert.equal(transaction.logs[0].args.class.toNumber(), 1);

            assert.equal(
                await supplyChain.classDescription(transaction.logs[0].args.class.toNumber()),
                instanceCreationDescription,
            );
            totalClasses = (await supplyChain.totalClasses()).toNumber();
            assert.equal(
                totalClasses,
                2,
            );
        });
    });

    describe('Steps', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();

            productCreationDescription = 'Product line created.';
            transaction = await supplyChain.newClass(productCreationDescription);
            productCreationClass = transaction.logs[0].args.class;

            instanceCreationDescription = 'Instance created.';
            transaction = await supplyChain.newClass(instanceCreationDescription);
            instanceCreationClass = transaction.logs[0].args.class;

            certificationCreationDescription = 'Certification created';
            transaction = await supplyChain.newClass(certificationCreationDescription);
            certificationCreationClass = transaction.logs[0].args.class;

            // instanceCertificationDescription = 'Instance certified';
            transaction = await supplyChain.newClass(certificationCreationDescription);
            instanceCertificationClass = transaction.logs[0].args.class;
        });

        it('newStep creates a step.', async () => {
            const productZero = 100;
            const productOne = 101;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(productCreationClass, productOne, [])
            ).logs[0].args.step;

            assert.equal(stepZero, 0);
            assert.equal(stepOne, 1);
        });

        it('newStep creates chains.', async () => {
            const productZero = 100;
            const instanceZero = 200;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZero, [stepZero])
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(instanceCertificationClass, instanceZero, [stepOne])
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getParents(stepOne))[0].toNumber(),
                stepZero.toNumber(),
            );
            assert.equal(
                (await supplyChain.getParents(stepTwo))[0].toNumber(),
                stepOne.toNumber(),
            );
        });

        it('newStep maintains lastSteps.', async () => {
            const instanceZero = 200;

            const stepZero = (
                await supplyChain.newStep(instanceCreationClass, instanceZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZero, [stepZero])
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
                const instanceZero = 100;
    
                const stepZero = (
                    await supplyChain.newStep(instanceCreationClass, instanceZero, [])
                ).logs[0].args.step;
                const stepOne = (
                    await supplyChain.newStep(instanceCertificationClass, instanceZero, [stepZero])
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.newStep(instanceCertificationClass, instanceZero, [stepZero])
                ).logs[0].args.step;
            },
            'Append only on last steps.',
        );

        it('newStep allows multiple parents.', async () => {
            const partZero = 200;
            const partOne = 201;
            const instanceZero = 202;

            const stepZero = (
                await supplyChain.newStep(instanceCreationClass, partZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, partOne, [])
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(instanceCreationClass, instanceZero, [stepZero, stepOne])
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getParents(stepTwo))[0].toNumber(),
                stepZero.toNumber(),
            );
            assert.equal(
                (await supplyChain.getParents(stepTwo))[1].toNumber(),
                stepOne.toNumber(),
            );
        });

        itShouldThrow(
            'instance must be unique or the same as a direct precedent.',
            async () => {    
                const instanceZero = 100;
    
                const stepZero = (
                    await supplyChain.newStep(instanceCreationClass, instanceZero, [])
                ).logs[0].args.step;
                const stepOne = (
                    await supplyChain.newStep(instanceCertificationClass, instanceZero, [stepZero])
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.newStep(instanceCreationClass, instanceZero, [])
                ).logs[0].args.step;
            },
            'Instance not valid.',
        );

        it('newStep records step creator.', async () => {
            const productZero = 100;
            const instanceZero = 200;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZero, [stepZero])
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(instanceCertificationClass, instanceZero, [stepOne], { from: user })
            ).logs[0].args.step;
            const certifier = (await supplyChain.steps.call(stepTwo)).owner;

            assert.equal(certifier, user);
        });

        it('newStep records class.', async () => {
            const productZero = 100;
            const instanceZero = 200;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZero, [stepZero])
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.steps.call(stepZero)).class).toNumber(),
                productCreationClass.toNumber(),
            );
            assert.equal(
                ((await supplyChain.steps.call(stepOne)).class).toNumber(),
                instanceCreationClass.toNumber(),
            );
        });

        it('newStep records instance.', async () => {
            const productZero = 100;
            const instanceZero = 200;
            const certificationZero = 300;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZero, [stepZero])
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(certificationCreationClass, certificationZero, [])
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.newStep(instanceCertificationClass, instanceZero, [stepOne, stepTwo])
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.steps.call(stepZero)).instance).toNumber(),
                productZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepOne)).instance).toNumber(),
                instanceZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepTwo)).instance).toNumber(),
                certificationZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepThree)).instance).toNumber(),
                instanceZero,
            );
        });

        it('lastSteps records instance.', async () => {
            const productZero = 100;
            const instanceZero = 200;
            const certificationZero = 300;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZero, [])
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZero, [stepZero])
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(certificationCreationClass, certificationZero, [])
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.newStep(instanceCertificationClass, instanceZero, [stepOne, stepTwo])
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.lastSteps.call(productZero))).toNumber(),
                stepZero,
            );
            assert.equal(
                ((await supplyChain.lastSteps.call(instanceZero))).toNumber(),
                stepThree,
            );
            assert.equal(
                ((await supplyChain.lastSteps.call(certificationZero))).toNumber(),
                stepTwo,
            );
        });
    });
});
