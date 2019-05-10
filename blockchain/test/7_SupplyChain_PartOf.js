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
    let itemCertificationAction;
    let itemCertificationDescription;
    let certificationCreationAction;
    let certificationCreationDescription;
    let transaction;
    const root = accounts[0];
    const operator1 = accounts[1];
    const operator2 = accounts[2];
    const owner1 = accounts[3];
    const owner2 = accounts[4];
    let rootRole;
    let operatorRole1;
    let ownerRole1;
    let operatorRole2;
    let ownerRole2;

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

            transaction = await supplyChain.addRootRole('Root', { from: root });
            rootRole = transaction.logs[0].args.role;

            transaction = await supplyChain.addRole('owner1', rootRole);
            ownerRole1 = transaction.logs[0].args.role;
            await supplyChain.addBearer(owner1, ownerRole1, { from: root });

            transaction = await supplyChain.addRole('operator1', ownerRole1);
            operatorRole1 = transaction.logs[0].args.role;
            await supplyChain.addBearer(operator1, operatorRole1, { from: owner1 });

            transaction = await supplyChain.addRole('owner2', rootRole);
            ownerRole2 = transaction.logs[0].args.role;
            await supplyChain.addBearer(owner2, ownerRole2, { from: root });

            transaction = await supplyChain.addRole('operator2', ownerRole2);
            operatorRole2 = transaction.logs[0].args.role;
            await supplyChain.addBearer(operator2, operatorRole2, { from: owner2 });
        });

        it('getComposite returns the immediate item for non-composites', async () => {
            await supplyChain.addBearer(operator1, operatorRole2, { from: owner2 });
            // await supplyChain.addBearer(operator1, ownerRole2, { from: root });


            const itemOne = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            const itemTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole2,
                    ownerRole2,
                    { from: owner2 },
                )
            ).logs[0].args.item;

            await supplyChain.addInfoStep(
                itemCreationAction,
                itemOne,
                [itemTwo],
                { from: operator1 },
            );

            assert.equal(
                (await supplyChain.getComposite(itemOne)).toNumber(),
                itemOne,
            );
            assert.equal(
                (await supplyChain.getComposite(itemTwo)).toNumber(),
                itemTwo,
            );
            assert.equal(
                (await supplyChain.getComposite(itemTwo)).toNumber(),
                itemTwo,
            );
        });

        it('getComposite returns item pointed by partOf.', async () => {
            // RootStep(1)
            const itemOne = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(2)
            const itemTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(1), RootStep(2) <- InfoStep(2)
            await supplyChain.addInfoStep(
                itemCreationAction,
                itemTwo,
                [itemOne],
                { from: operator1 },
            );
            // RootStep(1) <- PartOf(2)
            await supplyChain.addPartOfStep(
                itemCreationAction,
                [itemOne],
                itemTwo,
                { from: owner1 },
            );

            assert.equal(
                (await supplyChain.getComposite(itemOne)).toNumber(),
                itemTwo,
            );
        });

        it('getComposite returns item pointed by partOf recursively.', async () => {
            // RootStep(1)
            const itemOne = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(2)
            const itemTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(1,2) <- InfoStep(2)
            await supplyChain.addInfoStep(
                itemCreationAction,
                itemTwo,
                [itemOne],
                { from: operator1 },
            );
            // RootStep(1) <- PartOf(2)
            await supplyChain.addPartOfStep(
                itemCreationAction,
                itemOne,
                itemTwo,
                { from: owner1 },
            );
            // RootStep(3)
            const itemThree = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // (2,3) <- (3)
            await supplyChain.addInfoStep(
                itemCreationAction,
                itemThree,
                [itemTwo],
                { from: operator1 },
            );
            // (2) <- PartOf(3)
            await supplyChain.addPartOfStep(
                itemCreationAction,
                itemTwo,
                itemThree,
                { from: owner1 },
            );

            assert.equal(
                (await supplyChain.getComposite(itemOne)).toNumber(),
                itemThree,
            );
        });

        itShouldThrow(
            'addPartOfStep - Item must exist.',
            async () => {
                // RootStep(1) <- PartOf(2) X
                await supplyChain.addPartOfStep(
                    itemCreationAction,
                    1,
                    1,
                    { from: owner1 },
                );
            },
            'Item does not exist.',
        );

        itShouldThrow(
            'addPartOfStep - Composite item must exist.',
            async () => {
                // RootStep(1)
                const itemOne = (
                    await supplyChain.addRootStep(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // RootStep(1) <- PartOf(2) X
                await supplyChain.addPartOfStep(
                    itemCreationAction,
                    itemOne,
                    2,
                    { from: owner1 },
                );
            },
            'Composite item does not exist.',
        );

        itShouldThrow(
            'addPartOfStep - Needs owner for partOf.',
            async () => {
                // RootStep(1)
                const itemOne = (
                    await supplyChain.addRootStep(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // RootStep(2)
                const itemTwo = (
                    await supplyChain.addRootStep(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // (1,2) <- (2)
                await supplyChain.addInfoStep(
                    itemCreationAction,
                    itemTwo,
                    [itemOne],
                    { from: operator1 },
                );
                // (1) <- PartOf(2) X
                await supplyChain.addPartOfStep(
                    itemCreationAction,
                    itemOne,
                    itemTwo,
                    { from: operator1 },
                );
            },
            'Needs owner for partOf.',
        );

        itShouldThrow(
            'addPartOfStep - Item must be precedent of partOf.',
            async () => {
                // RootStep(1)
                const itemOne = (
                    await supplyChain.addRootStep(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // RootStep(2)
                const itemTwo = (
                    await supplyChain.addRootStep(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // RootStep(1) <- PartOf(2) X
                await supplyChain.addPartOfStep(
                    itemCreationAction,
                    itemOne,
                    itemTwo,
                    { from: owner1 },
                );
            },
            'Item not precedent of partOf.',
        );

        itShouldThrow(
            'addPartOfStep - derive operatorRole from composite.',
            async () => {
                // RootStep(1)
                const itemOne = (
                    await supplyChain.addRootStep(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // RootStep(2)
                const itemTwo = (
                    await supplyChain.addRootStep(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // (1,2) <- (2)
                await supplyChain.addInfoStep(
                    itemCreationAction,
                    itemTwo,
                    [itemOne],
                    { from: operator1 },
                );
                // RootStep(1) <- PartOf(2)
                await supplyChain.addPartOfStep(
                    itemCreationAction,
                    itemOne,
                    itemTwo,
                    { from: owner1 },
                );
                // TransformStep(2) <- HandoverStep(2)
                await supplyChain.addHandoverStep(
                    itemCreationAction,
                    itemTwo,
                    operatorRole2,
                    ownerRole2,
                    { from: owner1 },
                );
                // PartOf(2) <- operator(1) X
                await supplyChain.addInfoStep(
                    itemCreationAction,
                    itemOne,
                    [],
                    { from: operator1 },
                );
            },
            'Not an operator of precedents.',
        );

        it('addPartOfStep - sanity check.', async () => {
            // (1)
            transaction = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            );
            const itemOne = transaction.logs[0].args.item;
            const stepOne = transaction.logs[1].args.step;

            // (2)
            transaction = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            );
            const itemTwo = transaction.logs[0].args.item;
            const stepTwo = transaction.logs[1].args.step;

            // (1,2) <- (2)
            const stepThree = (
                await supplyChain.addInfoStep(
                    itemCreationAction,
                    itemTwo,
                    [itemOne],
                    { from: operator1 },
                )
            ).logs[0].args.step;

            // (1) <- PartOf(2)
            transaction = (
                await supplyChain.addPartOfStep(
                    itemCreationAction,
                    itemOne,
                    itemTwo,
                    { from: owner1 },
                )
            );
            const stepFour = transaction.logs[0].args.step;

            // (2) <- Handover(2)
            await supplyChain.addHandoverStep(
                itemCreationAction,
                itemTwo,
                operatorRole2,
                ownerRole2,
                { from: owner1 },
            );

            assert.equal(itemOne.toNumber(), 1);
            assert.equal(stepTwo.toNumber(), 2);

            assert.equal(itemOne.toNumber(), 1);
            assert.equal(stepTwo.toNumber(), 2);
            assert.equal(stepThree.toNumber(), 3);
            assert.equal(stepFour.toNumber(), 4);

            assert.equal(
                (await supplyChain.getPrecedents(stepFour)).length,
                1,
            );
            assert.equal(
                (await supplyChain.getPrecedents(stepFour))[0].toNumber(),
                stepOne,
            );

            assert.equal(
                (await supplyChain.getPartOf(itemOne)).toNumber(),
                itemTwo,
            );

            assert.equal(
                (await supplyChain.getOperatorRole(itemOne)).toNumber(),
                operatorRole2,
            );
            assert.equal(
                (await supplyChain.getOwnerRole(itemOne)).toNumber(),
                ownerRole2,
            );

            // Test part removal

            // (1) <- (1)
            await supplyChain.addInfoStep(
                itemCreationAction,
                itemOne,
                [],
                { from: operator2 },
            );

            assert.equal(
                (await supplyChain.getPartOf(itemOne)).toNumber(),
                0,
            );
        });

        it('getParts for an item without parts.', async () => {
            // RootStep(1)
            const itemOne = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;

            assert.equal(
                (await supplyChain.countParts(itemOne)).toNumber(),
                0,
            );
        });

        it('getParts ignores precedents that are not parts.', async () => {
            // RootStep(1)
            const itemOne = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(2)
            const itemTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // (1,2) <- (2)
            const stepThree = (
                await supplyChain.addInfoStep(
                    itemCreationAction,
                    itemTwo,
                    [itemOne],
                    { from: operator1 },
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getPrecedents(stepThree)).length,
                2,
            );
            assert.equal(
                (await supplyChain.countParts(itemTwo)).toNumber(),
                0,
            );
        });

        it('getParts for an item with one part.', async () => {
            // RootStep(1)
            const itemOne = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(2)
            const itemTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // (1,2) <- (2)
            const stepThree = (
                await supplyChain.addInfoStep(
                    itemCreationAction,
                    itemTwo,
                    [itemOne],
                    { from: operator1 },
                )
            ).logs[0].args.step;
            await supplyChain.addPartOfStep(
                itemCreationAction,
                itemOne,
                itemTwo,
                { from: owner1 },
            );

            assert.equal(
                (await supplyChain.getPrecedents(stepThree)).length,
                2,
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
            // RootStep(1)
            const itemOne = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(2)
            const itemTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(3)
            const itemThree = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(1,2,3) <- TransformStep(3)
            await supplyChain.addInfoStep(
                itemCreationAction,
                itemThree,
                [itemOne, itemTwo],
                { from: operator1 },
            );
            await supplyChain.addPartOfStep(
                itemCreationAction,
                itemOne,
                itemThree,
                { from: owner1 },
            );
            await supplyChain.addPartOfStep(
                itemCreationAction,
                itemTwo,
                itemThree,
                { from: owner1 },
            );

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
            // RootStep(1)
            const itemOne = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(2)
            const itemTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(3)
            const itemThree = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootStep(4)
            const itemFour = (
                await supplyChain.addRootStep(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // Item(1,2) <- AddInfo(1)
            await supplyChain.addInfoStep(
                itemCreationAction,
                itemOne,
                [itemTwo],
                { from: operator1 },
            );
            await supplyChain.addPartOfStep(
                itemCreationAction,
                itemTwo,
                itemOne,
                { from: owner1 },
            );
            // Item(1,3) <- AddInfo(1)
            await supplyChain.addInfoStep(
                itemCreationAction,
                itemOne,
                [itemThree],
                { from: operator1 },
            );
            await supplyChain.addPartOfStep(
                itemCreationAction,
                itemThree,
                itemOne,
                { from: owner1 },
            );
            // Item(1,4) <- AddInfo(1)
            await supplyChain.addInfoStep(
                itemCreationAction,
                itemOne,
                [itemFour],
                { from: operator1 },
            );
            await supplyChain.addPartOfStep(
                itemCreationAction,
                itemFour,
                itemOne,
                { from: owner1 },
            );

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
});
