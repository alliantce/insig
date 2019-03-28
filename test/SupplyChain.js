const SupplyChain = artifacts.require('./SupplyChain.sol');

const BigNumber = require('bignumber.js');
const chai = require('chai');
const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('SupplyChain', (accounts) => {
    let supplyChain;
    let creationClass;
    let creationDescription;
    let certificationClass;
    let certificationDescription;
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
            creationDescription = "Creation";

            transaction = await supplyChain.newClass(creationDescription, {from: owner})
            // console.log("Cost: $" + transaction.receipt.gasUsed / 3500000);

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, "ClassCreated");
            assert.equal(transaction.logs[0].args.classId.toNumber(), 0);

            assert.equal(
                await supplyChain.classDescription(transaction.logs[0].args.classId.toNumber()), 
                creationDescription,
            );
            let totalClasses = (await supplyChain.totalClasses()).toNumber();
            assert.equal(
                totalClasses, 
                1,
            );

            certificationDescription = 'Certification';
            transaction = await supplyChain.newClass(certificationDescription, {from: owner});

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, "ClassCreated");
            assert.equal(transaction.logs[0].args.classId.toNumber(), 1);

            assert.equal(
                await supplyChain.classDescription(transaction.logs[0].args.classId.toNumber()), 
                certificationDescription,
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

            creationDescription = 'Creation';
            transaction = await supplyChain.newClass(creationDescription);
            creationClass = transaction.logs[0].args.classId;

            certificationDescription = 'Certification';
            transaction = await supplyChain.newClass(certificationDescription);
            certificationClass = transaction.logs[0].args.classId;

        });

        it('newStep creates a step.', async () => { 
            stepZero = (
                await supplyChain.newStep([], creationClass)
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep([], creationClass)
            ).logs[0].args.stepId;

            assert.equal(stepZero, 0);
            assert.equal(stepOne, 1);
        });

        it('newStep creates chains.', async () => {
            stepZero = (
                await supplyChain.newStep([], creationClass)
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep([stepZero], certificationClass)
            ).logs[0].args.stepId;
            stepTwo = (
                await supplyChain.newStep([stepOne], certificationClass)
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
            stepZero = (
                await supplyChain.newStep([], creationClass)
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep([], creationClass)
            ).logs[0].args.stepId;
            stepTwo = (
                await supplyChain.newStep([stepZero, stepOne], certificationClass)
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
            stepZero = (
                await supplyChain.newStep([], creationClass)
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep([stepZero], certificationClass, { from: user })
            ).logs[0].args.stepId;
            const certifier = await supplyChain.getOwner(stepOne);

            assert.equal(certifier, user);
        });

        it('newStep records timestamp.', async () => {
            stepZero = (
                await supplyChain.newStep([], creationClass)
            ).logs[0].args.stepId;
            stepOne = (
                await supplyChain.newStep([stepZero], certificationClass)
            ).logs[0].args.stepId;

            assert.isAtLeast(
                (await supplyChain.getTimestamp(stepOne)).toNumber(), 
                (await supplyChain.getTimestamp(stepZero)).toNumber(),
            );
        });
    });
});
