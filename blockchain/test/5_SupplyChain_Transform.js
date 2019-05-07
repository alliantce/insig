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

    describe('addTransformStep', () => {
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

            transaction = await supplyChain.addRootRole("Root", { from: root });
            rootRole = transaction.logs[0].args.role;

            transaction = await supplyChain.addRole("owner1", rootRole);
            ownerRole1 = transaction.logs[0].args.role;
            await supplyChain.addBearer(owner1, ownerRole1, { from: root });

            transaction = await supplyChain.addRole("operator1", ownerRole1);
            operatorRole1 = transaction.logs[0].args.role;
            await supplyChain.addBearer(operator1, operatorRole1, { from: owner1 });

            transaction = await supplyChain.addRole("owner2", rootRole);
            ownerRole2 = transaction.logs[0].args.role;
            await supplyChain.addBearer(owner2, ownerRole2, { from: root });

            transaction = await supplyChain.addRole("operator2", ownerRole2);
            operatorRole2 = transaction.logs[0].args.role;
            await supplyChain.addBearer(operator2, operatorRole2, { from: owner2 });
        });

        // Check operator1 belongs to the operatorRole of all precedents.
        itShouldThrow(
            'addTransformStep - must be operator for all precedents.',
            async () => {    
                const partZero = 200;
                const partOne = 201;
                const itemZero = 202;
                
                const stepOne = (
                    await supplyChain.addRootStep(itemCreationAction, partZero, operatorRole1, ownerRole1, { from: owner1 })
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.addRootStep(itemCreationAction, partOne, operatorRole2, ownerRole2, { from: owner2 })
                ).logs[0].args.step;
                
                const stepThree = (
                    await supplyChain.addTransformStep(itemCreationAction, itemZero, [partZero, partOne], {from: operator1})
                ).logs[0].args.step;    
            },
            'Not an operator of precedents.',
        );
        
        // TODO: Test fails with no precedents
        // TODO: Test fails with existing item
        // TODO: Test fails with a precedent that doesn't exist in an array
        // TODO: Test fails with msg.sender not in the operator role of a precedent from an array
        // TODO: Test precedents built of last steps for precedentItems
        // TODO: Test operatorRole inherited from precedentItems[0]
        // TODO: Test ownerRole inherited from precedentItems[0]

        it('sanity check addTransformStep', async () => {
            const partZero = 200;
            const partOne = 201;
            const partTwo = 202;
            await supplyChain.addBearer(operator1, operatorRole2, { from: owner2 });


            const stepOne = (
                await supplyChain.addRootStep(itemCreationAction, partZero, operatorRole1, ownerRole1, { from: owner1 })
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addRootStep(itemCreationAction, partOne, operatorRole2, ownerRole2, { from: owner2 })
            ).logs[0].args.step;
            
            const stepThree = (
                await supplyChain.addTransformStep(itemCreationAction, partTwo, [partZero, partOne], {from: operator1})
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
    });
})
