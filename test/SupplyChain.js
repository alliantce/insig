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

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, "ClassCreated");
            assert.equal(transaction.logs[0].args.classId.toNumber(), 0);

            assert.equal(
                await supplyChain.classDescription(transaction.logs[0].args.classId.toNumber()), 
                "Creation",
            );
            let totalClasses = (await supplyChain.totalClasses()).toNumber();
            assert.equal(
                totalClasses, 
                1,
            );

            /* certificationDescription = 'Certification';
            certificationClass = (await supplyChain.newClass.call(certificationDescription)).toNumber();
            await supplyChain.newClass(certificationDescription);
            assert.equal(
                certificationClass, 
                1,
            );
            assert.equal(
                await supplyChain.classDescription.call(certificationClass), 
                certificationDescription,
            );
            totalClasses = (await supplyChain.totalClasses()).toNumber();
            assert.equal(
                totalClasses, 
                2,
            ); */
        });
    });

    describe('Steps', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();

            creationDescription = 'Creation';
            await supplyChain.newClass(creationDescription);
            creationClass = await supplyChain.totalClasses() - 1;

            certificationDescription = 'Certification';
            await supplyChain.newClass(certificationDescription);
            certificationClass = await supplyChain.totalClasses() - 1;

        });

        it('newStep creates a step.', async () => { 
            await supplyChain.newStep([], creationClass);
            const stepZero = await supplyChain.totalSteps() - 1;
            await supplyChain.newStep([], creationClass);
            const stepOne = await supplyChain.totalSteps() - 1; 

            assert.equal(stepZero, 0);
            assert.equal(stepOne, 1);
        });

        it('newStep creates chains.', async () => {
            await supplyChain.newStep([], creationClass);
            const stepZero = await supplyChain.totalSteps() - 1; 
            await supplyChain.newStep([stepZero], certificationClass);
            const stepOne = await supplyChain.totalSteps() - 1; 
            await supplyChain.newStep([stepOne], certificationClass);
            const stepTwo = await supplyChain.totalSteps() - 1; 
            const parentOfTwo = await supplyChain.getParents(stepTwo);

            assert.equal(parentOfTwo[0], 1);
        });

        it('newStep allows multiple parents.', async () => {
            await supplyChain.newStep([], creationClass);
            const stepZero = await supplyChain.totalSteps() - 1; 
            await supplyChain.newStep([stepZero], certificationClass);
            const stepOne = await supplyChain.totalSteps() - 1; 
            await supplyChain.newStep([stepZero], certificationClass);
            const stepTwo = await supplyChain.totalSteps() - 1; 
            await supplyChain.newStep([stepOne, stepTwo], 1);
            const stepThree = await supplyChain.totalSteps() - 1; 
            const parentsOfThree = await supplyChain.getParents(stepThree);

            assert.equal(parentsOfThree[0], stepOne);
            assert.equal(parentsOfThree[1], stepTwo);
            assert.equal(parentsOfThree.length, 2);
        });

        it('newStep records step creator.', async () => {
            await supplyChain.newStep([], creationClass);
            const stepZero = await supplyChain.totalSteps() - 1; 
            await supplyChain.newStep([stepZero], certificationClass, { from: user });
            const stepOne = await supplyChain.totalSteps() - 1; 
            const certifier = await supplyChain.getOwner(stepOne);

            assert.equal(certifier, user);
        });

        it('newStep records timestamp.', async () => {
            await supplyChain.newStep([], creationClass);
            const stepZero = await supplyChain.totalSteps() - 1; 
            await supplyChain.newStep([stepZero], certificationClass, { from: user });
            const stepOne = await supplyChain.totalSteps() - 1; 

            assert.isAtLeast(
                (await supplyChain.getTimestamp(stepOne)).toNumber(), 
                (await supplyChain.getTimestamp(stepZero)).toNumber(),
            );
        });
    });
});
