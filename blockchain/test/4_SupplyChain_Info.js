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

    describe('addInfoStep', () => {
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

        itShouldThrow(
            'Precedent items must exist.',
            async () => {    
                const itemOne = (
                    await supplyChain.addRootStep(
                        itemCreationAction, 
                        operatorRole1, 
                        ownerRole1, 
                        { from: owner1 }
                    )
                ).logs[0].args.item;
                await supplyChain.addInfoStep(
                    itemCertificationAction, 
                    itemOne, 
                    [2]
                );
            },
            'Precedent item does not exist.',
        );

        itShouldThrow(
            'item must be the same as a direct precedent.',
            async () => {
                const itemOne = (
                    await supplyChain.addRootStep(
                        itemCreationAction, 
                        operatorRole1, 
                        ownerRole1, 
                        { from: owner1 }
                    )
                ).logs[0].args.item;
                const itemTwo = (
                    await supplyChain.addRootStep(
                        itemCreationAction, 
                        operatorRole1, 
                        ownerRole1, 
                        { from: owner1 }
                    )
                ).logs[0].args.item;
                await supplyChain.addInfoStep(
                    itemCertificationAction, 
                    itemTwo,
                    [itemOne]
                );
            },
            'Item not in precedents.',
        );

        // TODO: Test fails with no precedents
        // TODO: Test fails with a precedent that doesn't exist in an array of existing precedents
        // TODO: Test fails if item not in precedent steps
        // TODO: Test fails if msg.sender not in operator role for one of the precedents
        // TODO: Test precedents point to last steps of items passed as parameters
        // TODO: Test operatorRole inherited from precedents[0]
        // TODO: Test ownerRole inherited from precedents[0]

        it('sanity check addInfoStep', async () => {
            await supplyChain.addBearer(operator1, operatorRole2, { from: owner2 });
            await supplyChain.addBearer(operator1, ownerRole2, { from: root });

            const itemOne = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    operatorRole1, 
                    ownerRole1, 
                    { from: owner1 }
                )
            ).logs[0].args.item;
            const itemTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    operatorRole2, 
                    ownerRole2, 
                    { from: owner2 }
                )
            ).logs[0].args.item;
            
            await supplyChain.addInfoStep(
                itemCreationAction, 
                itemOne, 
                [itemOne, itemTwo], 
                {from: operator1}
            );
        });
    });
})
