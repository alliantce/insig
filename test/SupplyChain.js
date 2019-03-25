const SupplyChain = artifacts.require('./SupplyChain.sol');

const BigNumber = require('bignumber.js');
const chai = require('chai');
const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('SupplyChain', (accounts) => {
    let supplyChain;
    const owner = accounts[0];
    const user = accounts[1];

    before(async () => {
        supplyChain = await SupplyChain.deployed();
    });

    describe('SupplyChain', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();
            await supplyChain.newClass("Class0");
            await supplyChain.newClass("Class1");

        });

        it('newClass creates a class.', async () => {
            const class0 = await supplyChain.classDescription(0);
            const class1 = await supplyChain.classDescription(1);

            assert.equal(class0, "Class0");
            assert.equal(class1, "Class1");
        });

        it('newStep creates a step.', async () => {
            const stepZero = await supplyChain.newStep([], 0);
            const stepOne = await supplyChain.newStep([], 0);

            assert.equal(stepZero, 0);
            assert.equal(stepOne, 1);
        });

        it('newStep creates chains.', async () => {
            const stepZero = await supplyChain.newStep([], 0);
            const stepOne = await supplyChain.newStep([0], 1);
            const stepTwo = await supplyChain.newStep([1], 1);
            const parentOfTwo = await supplyChain.getParents(2);

            assert.equal(parentOfTwo[0], 1);
        });

        it('newStep allows multiple parents.', async () => {
            const stepZero = await supplyChain.newStep([], 0);
            const stepOne = await supplyChain.newStep([0], 1);
            const stepTwo = await supplyChain.newStep([0], 1);
            const stepThree = await supplyChain.newStep([1, 1], 1);
            const parentsOfThree = await supplyChain.getParents(3);

            assert.equal(parentsOfThree[0], 1);
            assert.equal(parentsOfThree[1], 1);
            assert.equal(parentsOfThree.length, 2);
        });
    });
});
