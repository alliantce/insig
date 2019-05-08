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

    describe('addPartOfStep and composition', () => {
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
                    partZero, 
                    [partZero, partOne], 
                    {from: operator1}
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getComposite(partZero)).toNumber(),
                partZero,
            );
            assert.equal(
                (await supplyChain.getComposite(partOne)).toNumber(),
                partOne,
            );
            assert.equal(
                (await supplyChain.getComposite(partOne)).toNumber(),
                partOne,
            );
        });

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
                    [itemOne], 
                    {from: operator1}
                )
            ).logs[0].args.step;
            // RootStep(1) <- PartOf(2)
            const stepThree = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    [itemOne],
                    itemTwo, 
                    {from: owner1}
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getComposite(itemOne)).toNumber(),
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
                    [itemOne], 
                    {from: operator1}
                )
            ).logs[0].args.step;
            // RootStep(1) <- PartOf(2)
            const stepThree = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    itemOne,
                    itemTwo, 
                    {from: owner1}
                )
            ).logs[0].args.step;
            // TransformStep(2) <- TransformStep(3)
            const stepFour = (
                await supplyChain.addTransformStep(
                    itemCreationAction, 
                    itemThree, 
                    [itemTwo], 
                    {from: operator1}
                )
            ).logs[0].args.step;
            // TransformStep(2) <- PartOf(3)
            const stepFive = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    itemTwo,
                    itemThree, 
                    {from: owner1}
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getComposite(itemOne)).toNumber(),
                itemThree,
            );
        });

        itShouldThrow(
            'addPartOfStep - Item must exist.',
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
                        itemTwo,
                        itemTwo, 
                        {from: owner1}
                    )
                ).logs[0].args.step;
            },
            'Item does not exist.',
        );

        itShouldThrow(
            'addPartOfStep - Composite item must exist.',
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
                        itemOne,
                        itemTwo, 
                        {from: owner1}
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
                        [itemOne], 
                        {from: operator1}
                    )
                ).logs[0].args.step;
                // RootStep(1) <- PartOf(2) X
                const stepThree = (
                    await supplyChain.addPartOfStep(
                        itemCreationAction, 
                        itemOne,
                        itemTwo, 
                        {from: operator1}
                    )
                ).logs[0].args.step;
            },
            'Needs owner for partOf.',
        );

        itShouldThrow(
            'addPartOfStep - Item must be precedent of partOf.',
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
                // RootStep(2)
                const stepTwo = (
                    await supplyChain.addRootStep(
                        itemCreationAction, 
                        itemTwo, 
                        operatorRole1, 
                        ownerRole1, 
                        { from: owner1 }
                    )
                ).logs[0].args.step;
                // RootStep(1) <- PartOf(2) X
                const stepThree = (
                    await supplyChain.addPartOfStep(
                        itemCreationAction, 
                        itemOne,
                        itemTwo, 
                        {from: owner1}
                    )
                ).logs[0].args.step;
            },
            'Item not precedent of partOf.',
        );

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
                        [itemOne], 
                        {from: operator1}
                    )
                ).logs[0].args.step;
                // RootStep(1) <- PartOf(2)
                const stepThree = (
                    await supplyChain.addPartOfStep(
                        itemCreationAction, 
                        itemOne,
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
                        [itemOne], 
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
                    [itemOne], 
                    {from: operator1}
                )
            ).logs[0].args.step;
            // RootStep(1) <- PartOf(2)
            const stepThree = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    itemOne,
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
                    [itemOne],
                    {from: operator2}
                )
            ).logs[0].args.step;
        });

        it('getParts for an item without parts.', async () => {
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

            assert.equal(
                (await supplyChain.countParts(itemOne)).toNumber(),
                0,
            );
        });

        it('getParts for an item with one part.', async () => {
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
                    [itemOne], 
                    {from: operator1}
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getPrecedents(stepTwo))[0].toNumber(),
                stepOne,
            );
            assert.equal(
                (await supplyChain.countParts(itemTwo)).toNumber(),
                1,
            );
            assert.equal(
                (await supplyChain.getParts(itemTwo))[0].toNumber(),
                itemOne,
            );
        });

        it('getParts for an item with two parts.', async () => {
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
            // RootStep(2)
            const stepTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    itemTwo, 
                    operatorRole1, 
                    ownerRole1, 
                    { from: owner1 }
                )
            ).logs[0].args.step;
            // RootStep(1,2) <- TransformStep(3)
            const stepThree = (
                await supplyChain.addTransformStep(
                    itemCreationAction, 
                    itemThree, 
                    [itemOne, itemTwo], 
                    {from: operator1}
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.countParts(itemThree)).toNumber(),
                2,
            );
            assert.equal(
                (await supplyChain.getParts(itemThree))[0].toNumber(),
                itemOne,
            );
            assert.equal(
                (await supplyChain.getParts(itemThree))[1].toNumber(),
                itemTwo,
            );
        });

        it('getParts going deep.', async () => {
            const itemOne = 201;
            const itemTwo = 202;
            const itemThree = 203;
            const itemFour = 204;

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
            // RootStep(2)
            const stepTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    itemTwo, 
                    operatorRole1, 
                    ownerRole1, 
                    { from: owner1 }
                )
            ).logs[0].args.step;
            // RootStep(3)
            const stepThree = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    itemThree, 
                    operatorRole1, 
                    ownerRole1, 
                    { from: owner1 }
                )
            ).logs[0].args.step;
            // RootStep(4)
            const stepFour = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    itemFour, 
                    operatorRole1, 
                    ownerRole1, 
                    { from: owner1 }
                )
            ).logs[0].args.step;
            // Item(1,2) <- AddInfo(1)
            const stepFive = (
                await supplyChain.addInfoStep(
                    itemCreationAction, 
                    itemOne, 
                    [itemOne, itemTwo],
                    {from: operator1}
                )
            ).logs[0].args.step;
            // Item(1,3) <- AddInfo(1)
            const stepSix = (
                await supplyChain.addInfoStep(
                    itemCreationAction, 
                    itemOne, 
                    [itemOne, itemThree],
                    {from: operator1}
                )
            ).logs[0].args.step;
            // Item(1,4) <- AddInfo(1)
            const stepSeven = (
                await supplyChain.addInfoStep(
                    itemCreationAction, 
                    itemOne, 
                    [itemOne, itemFour],
                    {from: operator1}
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.countParts(itemOne)).toNumber(),
                3,
            );
            assert.equal(
                (await supplyChain.getParts(itemOne))[0].toNumber(),
                itemFour,
            );
            assert.equal(
                (await supplyChain.getParts(itemOne))[1].toNumber(),
                itemThree,
            );
            assert.equal(
                (await supplyChain.getParts(itemOne))[2].toNumber(),
                itemTwo,
            );
        });
    });
})
