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

    describe('Steps as Supply Chain', () => {
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

        // If there are no precedents check operator1 belongs to operators of the current step.
        itShouldThrow(
            'addRootStep - operator must be owner for created step.',
            async () => {    
                const itemZero = 100;
    
                const stepOne = (
                    await supplyChain.addRootStep(itemCreationAction, itemZero, operator1, owner1, { from: owner1 })
                ).logs[0].args.step;
            },
            'Creator not in ownerRole.',
        );

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
                    await supplyChain.addTransformStep(itemCreationAction, itemZero, [stepOne, stepTwo], {from: operator1})
                ).logs[0].args.step;    
            },
            'Not an operator of precedents.',
        );

        // If permissions are different to a precedent with the same instance id check user belongs to its ownerRole.
        itShouldThrow(
            'addHandoverStep - only ownerRole can change permissions.',
            async () => {    
                const partZero = 200;
                await supplyChain.addBearer(operator1, operatorRole2, { from: owner2 });


                const stepOne = (
                    await supplyChain.addRootStep(itemCreationAction, partZero, operatorRole1, ownerRole1, { from: owner1 })
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.addHandoverStep(itemCreationAction, partZero, operatorRole2, ownerRole2, {from: operator1})
                ).logs[0].args.step;    
            },
            'Needs owner for handover.',
        );

        it('sanity check addRootStep and addInfoStep', async () => {
            const partZero = 200;
            const partOne = 201;
            await supplyChain.addBearer(operator1, operatorRole2, { from: owner2 });
            await supplyChain.addBearer(operator1, ownerRole2, { from: root });

            const stepOne = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    partZero, 
                    operatorRole1, 
                    ownerRole1, 
                    { from: owner1 }
                )
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    partOne, 
                    operatorRole2, 
                    ownerRole2, 
                    { from: owner2 }
                )
            ).logs[0].args.step;
            
            const stepThree = (
                await supplyChain.addInfoStep(
                    itemCreationAction, 
                    partOne, 
                    [stepOne, stepTwo], 
                    {from: operator1}
                )
            ).logs[0].args.step;
        });


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
                await supplyChain.addTransformStep(itemCreationAction, partTwo, [stepOne, stepTwo], {from: operator1})
            ).logs[0].args.step;  
        });

        it('sanity check addHandoverStep', async () => {
            const partZero = 200;

            const stepOne = (
                await supplyChain.addRootStep(itemCreationAction, partZero, operatorRole1, ownerRole1, { from: owner1 })
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addHandoverStep(itemCreationAction, partZero, operatorRole2, ownerRole2, {from: owner1})
            ).logs[0].args.step;  
        });

        it('getComposite returns the immediate item for non-composites', async () => {
            const partZero = 200;
            const partOne = 201;
            await supplyChain.addBearer(operator1, operatorRole2, { from: owner2 });
            // await supplyChain.addBearer(operator1, ownerRole2, { from: root });


            const stepOne = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    partZero, 
                    operatorRole1, 
                    ownerRole1, 
                    { from: owner1 }
                )
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    partOne, 
                    operatorRole2, 
                    ownerRole2, 
                    { from: owner2 }
                )
            ).logs[0].args.step;
            
            const stepThree = (
                await supplyChain.addInfoStep(
                    itemCreationAction, 
                    partOne, 
                    [stepOne, stepTwo], 
                    {from: operator1}
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getComposite(stepOne)).toNumber(),
                partZero,
            );
            assert.equal(
                (await supplyChain.getComposite(stepTwo)).toNumber(),
                partOne,
            );
            assert.equal(
                (await supplyChain.getComposite(stepThree)).toNumber(),
                partOne,
            );
        });

        itShouldThrow(
            'addPartOfStep - Composite item does not exist.',
            async () => {    
                const itemOne = 201;
                const itemTwo = 202;

                // RootStep(1)
                const stepOne = (
                    await supplyChain.addRootStep(
                        itemCreationAction, 
                        itemOne, 
                        operatorRole1, 
                        ownerRole1, 
                        { from: owner1 }
                    )
                ).logs[0].args.step;
                // RootStep(1) <- PartOf(2) X
                const stepTwo = (
                    await supplyChain.addPartOfStep(
                        itemCreationAction, 
                        [stepOne],
                        itemTwo, 
                        {from: operator1}
                    )
                ).logs[0].args.step;
            },
            'Composite item does not exist.',
        );

        itShouldThrow(
            'addPartOfStep - Needs owner for partOf.',
            async () => {    
                const itemOne = 201;
                const itemTwo = 202;

                // RootStep(1)
                const stepOne = (
                    await supplyChain.addRootStep(
                        itemCreationAction, 
                        itemOne, 
                        operatorRole1, 
                        ownerRole1, 
                        { from: owner1 }
                    )
                ).logs[0].args.step;
                // RootStep(1) <- TransformStep(2)
                const stepTwo = (
                    await supplyChain.addTransformStep(
                        itemCreationAction, 
                        itemTwo, 
                        [stepOne], 
                        {from: operator1}
                    )
                ).logs[0].args.step;
                // RootStep(1) <- PartOf(2) X
                const stepThree = (
                    await supplyChain.addPartOfStep(
                        itemCreationAction, 
                        [stepOne],
                        itemTwo, 
                        {from: operator1}
                    )
                ).logs[0].args.step;
            },
            'Needs owner for partOf.',
        );

        it('getComposite returns item pointed by partOf.', async () => {
            const itemOne = 201;
            const itemTwo = 202;

            // RootStep(1)
            const stepOne = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    itemOne, 
                    operatorRole1, 
                    ownerRole1, 
                    { from: owner1 }
                )
            ).logs[0].args.step;
            // RootStep(1) <- TransformStep(2)
            const stepTwo = (
                await supplyChain.addTransformStep(
                    itemCreationAction, 
                    itemTwo, 
                    [stepOne], 
                    {from: operator1}
                )
            ).logs[0].args.step;
            // RootStep(1) <- PartOf(2)
            const stepThree = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    [stepOne],
                    itemTwo, 
                    {from: owner1}
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getComposite(stepThree)).toNumber(),
                itemTwo,
            );
        });

        it('getComposite returns item pointed by partOf recursively.', async () => {
            const itemOne = 201;
            const itemTwo = 202;
            const itemThree = 203;

            // RootStep(1)
            const stepOne = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    itemOne, 
                    operatorRole1, 
                    ownerRole1, 
                    { from: owner1 }
                )
            ).logs[0].args.step;
            // RootStep(1) <- TransformStep(2)
            const stepTwo = (
                await supplyChain.addTransformStep(
                    itemCreationAction, 
                    itemTwo, 
                    [stepOne], 
                    {from: operator1}
                )
            ).logs[0].args.step;
            // RootStep(1) <- PartOf(2)
            const stepThree = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    [stepOne],
                    itemTwo, 
                    {from: owner1}
                )
            ).logs[0].args.step;
            // TransformStep(2) <- TransformStep(3)
            const stepFour = (
                await supplyChain.addTransformStep(
                    itemCreationAction, 
                    itemThree, 
                    [stepTwo], 
                    {from: operator1}
                )
            ).logs[0].args.step;
            // TransformStep(2) <- PartOf(3)
            const stepFive = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    [stepTwo],
                    itemThree, 
                    {from: owner1}
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getComposite(stepThree)).toNumber(),
                itemThree,
            );
        });

        itShouldThrow(
            'addPartOfStep - derive operatorRole from composite.',
            async () => {
                const itemOne = 201;
                const itemTwo = 202;

                // RootStep(1)
                const stepOne = (
                    await supplyChain.addRootStep(
                        itemCreationAction, 
                        itemOne, 
                        operatorRole1, 
                        ownerRole1, 
                        { from: owner1 }
                    )
                ).logs[0].args.step;
                // RootStep(1) <- TransformStep(2)
                const stepTwo = (
                    await supplyChain.addTransformStep(
                        itemCreationAction, 
                        itemTwo, 
                        [stepOne], 
                        {from: operator1}
                    )
                ).logs[0].args.step;
                // RootStep(1) <- PartOf(2)
                const stepThree = (
                    await supplyChain.addPartOfStep(
                        itemCreationAction, 
                        [stepOne],
                        itemTwo, 
                        {from: owner1}
                    )
                ).logs[0].args.step;
                // TransformStep(2) <- HandoverStep(2)
                const stepFour = (
                    await supplyChain.addHandoverStep(
                        itemCreationAction, 
                        itemTwo, 
                        operatorRole2, 
                        ownerRole2, 
                        {from: owner1}
                    )
                ).logs[0].args.step; 
                // PartOf(2) <- operator(1) X
                const stepFive = (
                    await supplyChain.addInfoStep(
                        itemCreationAction, 
                        itemOne, 
                        [stepThree], 
                        {from: operator1}
                    )
                ).logs[0].args.step;
            },
            'Not an operator of precedents.',
        );

        it('addPartOfStep - sanity check.', async () => {
            const itemOne = 201;
            const itemTwo = 202;

            // RootStep(1)
            const stepOne = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    itemOne, 
                    operatorRole1, 
                    ownerRole1, 
                    { from: owner1 }
                )
            ).logs[0].args.step;
            // RootStep(1) <- TransformStep(2)
            const stepTwo = (
                await supplyChain.addTransformStep(
                    itemCreationAction, 
                    itemTwo, 
                    [stepOne], 
                    {from: operator1}
                )
            ).logs[0].args.step;
            // RootStep(1) <- PartOf(2)
            const stepThree = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    [stepOne],
                    itemTwo, 
                    {from: owner1}
                )
            ).logs[0].args.step;
            // TransformStep(2) <- HandoverStep(2)
            const stepFour = (
                await supplyChain.addHandoverStep(
                    itemCreationAction, 
                    itemTwo, 
                    operatorRole2, 
                    ownerRole2, 
                    {from: owner1}
                )
            ).logs[0].args.step; 
            // PartOf(2) <- operator(2)
            const stepFive = (
                await supplyChain.addInfoStep(
                    itemCreationAction, 
                    itemOne, 
                    [stepThree],
                    {from: operator2}
                )
            ).logs[0].args.step;
        });
    });
})