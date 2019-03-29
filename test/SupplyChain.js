const SupplyChain = artifacts.require('./SupplyChain.sol');

const BigNumber = require('bignumber.js');
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
    let instanceCertificationDescription;
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
            productCreationDescription = "Product line created.";

            transaction = await supplyChain.newClass(productCreationDescription, {from: owner})
            // console.log("Cost: $" + transaction.receipt.gasUsed / 3500000);

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, "ClassCreated");
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
            transaction = await supplyChain.newClass(instanceCreationDescription, {from: owner});

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, "ClassCreated");
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

            instanceCertificationDescription = 'Instance certified';
            transaction = await supplyChain.newClass(certificationCreationDescription);
            instanceCertificationClass = transaction.logs[0].args.classId;
        });

        it('newStep creates a step.', async () => { 
            productZeroId = 100;
            productOneId = 101;
            
            stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep(productCreationClass, productOneId, [])
            ).logs[0].args.stepId;

            assert.equal(stepZero, 0);
            assert.equal(stepOne, 1);
        });

        it('newStep creates chains.', async () => {
            productZeroId = 100;
            instanceZeroId = 200;
            certificationZeroId = 300;
            
            stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;
            stepTwo = (
                await supplyChain.newStep(instanceCertificationClass, instanceZeroId, [stepOne])
            ).logs[0].args.stepId;

            assert.equal(
                (await supplyChain.getParents(stepOne))[0].toNumber(), 
                stepZero.toNumber()
            );
            assert.equal(
                (await supplyChain.getParents(stepTwo))[0].toNumber(), 
                stepOne.toNumber()
            );
        });

        it('newStep allows multiple parents.', async () => {
            partZeroId = 200;
            partOneId = 201;
            instanceZeroId = 202;
            
            stepZero = (
                await supplyChain.newStep(instanceCreationClass, partZeroId, [])
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep(instanceCreationClass, partOneId, [])
            ).logs[0].args.stepId;
            stepTwo = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero, stepOne])
            ).logs[0].args.stepId;

            assert.equal(
                (await supplyChain.getParents(stepTwo))[0].toNumber(), 
                stepZero.toNumber()
            );
            assert.equal(
                (await supplyChain.getParents(stepTwo))[1].toNumber(), 
                stepOne.toNumber()
            );
        });

        it('newStep records step creator.', async () => {
            productZeroId = 100;
            instanceZeroId = 200;
            
            stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;
            stepTwo = (
                await supplyChain.newStep(instanceCertificationClass, instanceZeroId, [stepOne], { from: user })
            ).logs[0].args.stepId;
            const certifier = await supplyChain.getOwner(stepTwo);

            assert.equal(certifier, user);
        });

        it('newStep records timestamp.', async () => {
            productZeroId = 100;
            instanceZeroId = 200;
            
            stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;

            assert.isAtLeast(
                (await supplyChain.getTimestamp(stepOne)).toNumber(), 
                (await supplyChain.getTimestamp(stepZero)).toNumber(),
            );
        });

        it('newStep records class.', async () => {
            productZeroId = 100;
            instanceZeroId = 200;
            
            stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;

            assert.equal(
                (await supplyChain.getClass(stepZero)).toNumber(), 
                productCreationClass.toNumber()
            );
            assert.equal(
                (await supplyChain.getClass(stepOne)).toNumber(), 
                instanceCreationClass.toNumber()
            );
        });

        it('newStep records instance.', async () => {
            productZeroId = 100;
            instanceZeroId = 200;
            certificationZeroId = 300;
            
            stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;
            stepTwo = (
                await supplyChain.newStep(certificationCreationClass, certificationZeroId, [])
            ).logs[0].args.stepId;
            stepThree = (
                await supplyChain.newStep(instanceCertificationClass, instanceZeroId, [stepOne, stepTwo])
            ).logs[0].args.stepId;

            assert.equal(
                (await supplyChain.getInstance(stepZero)).toNumber(), 
                productZeroId
            );
            assert.equal(
                (await supplyChain.getInstance(stepOne)).toNumber(), 
                instanceZeroId
            );
            assert.equal(
                (await supplyChain.getInstance(stepTwo)).toNumber(), 
                certificationZeroId
            );
            assert.equal(
                (await supplyChain.getInstance(stepThree)).toNumber(), 
                instanceZeroId
            );
        });

        it('lastSteps records instance.', async () => {
            productZeroId = 100;
            instanceZeroId = 200;
            certificationZeroId = 300;
            
            stepZero = (
                await supplyChain.newStep(productCreationClass, productZeroId, [])
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep(instanceCreationClass, instanceZeroId, [stepZero])
            ).logs[0].args.stepId;
            stepTwo = (
                await supplyChain.newStep(certificationCreationClass, certificationZeroId, [])
            ).logs[0].args.stepId;
            stepThree = (
                await supplyChain.newStep(instanceCertificationClass, instanceZeroId, [stepOne, stepTwo])
            ).logs[0].args.stepId;

            assert.equal(
                (await supplyChain.getLastStep(productZeroId)).toNumber(), 
                stepZero
            );
            assert.equal(
                (await supplyChain.getLastStep(instanceZeroId)).toNumber(), 
                stepThree
            );
            assert.equal(
                (await supplyChain.getLastStep(certificationZeroId)).toNumber(), 
                stepTwo
            );
        });
    });
});
