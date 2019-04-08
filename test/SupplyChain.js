const SupplyChain = artifacts.require('./SupplyChain.sol');

const chai = require('chai');
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
            assert.equal(transaction.logs[0].args.classId.toNumber(), 0);

            assert.equal(
                await supplyChain.classDescription(transaction.logs[0].args.classId.toNumber()),
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
            assert.equal(transaction.logs[0].args.classId.toNumber(), 1);

            assert.equal(
                await supplyChain.classDescription(transaction.logs[0].args.classId.toNumber()),
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
            productCreationClass = transaction.logs[0].args.classId;

            instanceCreationDescription = 'Instance created.';
            transaction = await supplyChain.newClass(instanceCreationDescription);
            instanceCreationClass = transaction.logs[0].args.classId;

            certificationCreationDescription = 'Certification created';
            transaction = await supplyChain.newClass(certificationCreationDescription);
            certificationCreationClass = transaction.logs[0].args.classId;

            // instanceCertificationDescription = 'Instance certified';
            transaction = await supplyChain.newClass(certificationCreationDescription);
            instanceCertificationClass = transaction.logs[0].args.classId;
        });

        it('newStep creates a step.', async () => {
            const productZeroId = 100;
            const productOneId = 101;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            const stepOne = (
                await supplyChain.newStep(productCreationClass, productOneId, [])
            ).logs[0].args.stepId;

            assert.equal(stepZero, 0);
            assert.equal(stepOne, 1);
        });

        it('newStep creates chains.', async () => {
            const productZeroId = 100;
            const instanceZeroId = 200;
            // const certificationZeroId = 300;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;
            const stepTwo = (
                await supplyChain.newStep(instanceCertificationClass, instanceZeroId, [stepOne])
            ).logs[0].args.stepId;

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
            const instanceZeroId = 200;

            const stepZero = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [])
            ).logs[0].args.stepId;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;

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

        it('newStep allows multiple parents.', async () => {
            const partZeroId = 200;
            const partOneId = 201;
            const instanceZeroId = 202;

            const stepZero = (
                await supplyChain.newStep(instanceCreationClass, partZeroId, [])
            ).logs[0].args.stepId;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, partOneId, [])
            ).logs[0].args.stepId;
            const stepTwo = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero, stepOne])
            ).logs[0].args.stepId;

            assert.equal(
                (await supplyChain.getParents(stepTwo))[0].toNumber(),
                stepZero.toNumber(),
            );
            assert.equal(
                (await supplyChain.getParents(stepTwo))[1].toNumber(),
                stepOne.toNumber(),
            );
        });

        it('newStep records step creator.', async () => {
            const productZeroId = 100;
            const instanceZeroId = 200;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;
            const stepTwo = (
                await supplyChain.newStep(instanceCertificationClass, instanceZeroId, [stepOne], { from: user })
            ).logs[0].args.stepId;
            const certifier = (await supplyChain.steps.call(stepTwo)).owner;

            assert.equal(certifier, user);
        });

        it('newStep records class.', async () => {
            const productZeroId = 100;
            const instanceZeroId = 200;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;

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
            const productZeroId = 100;
            const instanceZeroId = 200;
            const certificationZeroId = 300;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;
            const stepTwo = (
                await supplyChain.newStep(certificationCreationClass, certificationZeroId, [])
            ).logs[0].args.stepId;
            const stepThree = (
                await supplyChain.newStep(instanceCertificationClass, instanceZeroId, [stepOne, stepTwo])
            ).logs[0].args.stepId;

            assert.equal(
                ((await supplyChain.steps.call(stepZero)).instance).toNumber(),
                productZeroId,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepOne)).instance).toNumber(),
                instanceZeroId,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepTwo)).instance).toNumber(),
                certificationZeroId,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepThree)).instance).toNumber(),
                instanceZeroId,
            );
        });

        it('lastSteps records instance.', async () => {
            const productZeroId = 100;
            const instanceZeroId = 200;
            const certificationZeroId = 300;

            const stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            const stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;
            const stepTwo = (
                await supplyChain.newStep(certificationCreationClass, certificationZeroId, [])
            ).logs[0].args.stepId;
            const stepThree = (
                await supplyChain.newStep(instanceCertificationClass, instanceZeroId, [stepOne, stepTwo])
            ).logs[0].args.stepId;

            assert.equal(
                ((await supplyChain.lastSteps.call(productZeroId))).toNumber(),
                stepZero,
            );
            assert.equal(
                ((await supplyChain.lastSteps.call(instanceZeroId))).toNumber(),
                stepThree,
            );
            assert.equal(
                ((await supplyChain.lastSteps.call(certificationZeroId))).toNumber(),
                stepTwo,
            );
        });
    });
});
