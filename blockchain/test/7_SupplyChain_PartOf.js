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

    describe('addPartOfState and composition', () => {
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
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            const itemTwo = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole2,
                    ownerRole2,
                    { from: owner2 },
                )
            ).logs[0].args.item;

            await supplyChain.addInfoState(
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
            // RootState(1)
            const itemOne = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(2)
            const itemTwo = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(1), RootState(2) <- InfoState(2)
            await supplyChain.addInfoState(
                itemCreationAction,
                itemTwo,
                [itemOne],
                { from: operator1 },
            );
            // RootState(1) <- PartOf(2)
            await supplyChain.addPartOfState(
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
            // RootState(1)
            const itemOne = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(2)
            const itemTwo = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(1,2) <- InfoState(2)
            await supplyChain.addInfoState(
                itemCreationAction,
                itemTwo,
                [itemOne],
                { from: operator1 },
            );
            // RootState(1) <- PartOf(2)
            await supplyChain.addPartOfState(
                itemCreationAction,
                itemOne,
                itemTwo,
                { from: owner1 },
            );
            // RootState(3)
            const itemThree = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // (2,3) <- (3)
            await supplyChain.addInfoState(
                itemCreationAction,
                itemThree,
                [itemTwo],
                { from: operator1 },
            );
            // (2) <- PartOf(3)
            await supplyChain.addPartOfState(
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
            'addPartOfState - Item must exist.',
            async () => {
                // RootState(1) <- PartOf(2) X
                await supplyChain.addPartOfState(
                    itemCreationAction,
                    1,
                    1,
                    { from: owner1 },
                );
            },
            'Item does not exist.',
        );

        itShouldThrow(
            'addPartOfState - Composite item must exist.',
            async () => {
                // RootState(1)
                const itemOne = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // RootState(1) <- PartOf(2) X
                await supplyChain.addPartOfState(
                    itemCreationAction,
                    itemOne,
                    2,
                    { from: owner1 },
                );
            },
            'Composite item does not exist.',
        );

        itShouldThrow(
            'addPartOfState - Needs owner for partOf.',
            async () => {
                // RootState(1)
                const itemOne = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // RootState(2)
                const itemTwo = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // (1,2) <- (2)
                await supplyChain.addInfoState(
                    itemCreationAction,
                    itemTwo,
                    [itemOne],
                    { from: operator1 },
                );
                // (1) <- PartOf(2) X
                await supplyChain.addPartOfState(
                    itemCreationAction,
                    itemOne,
                    itemTwo,
                    { from: operator1 },
                );
            },
            'Needs owner for partOf.',
        );

        itShouldThrow(
            'addPartOfState - Item must be precedent of partOf.',
            async () => {
                // RootState(1)
                const itemOne = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // RootState(2)
                const itemTwo = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // RootState(1) <- PartOf(2) X
                await supplyChain.addPartOfState(
                    itemCreationAction,
                    itemOne,
                    itemTwo,
                    { from: owner1 },
                );
            },
            'Item not precedent of partOf.',
        );

        itShouldThrow(
            'addPartOfState - derive operatorRole from composite.',
            async () => {
                // RootState(1)
                const itemOne = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // RootState(2)
                const itemTwo = (
                    await supplyChain.addRootState(
                        itemCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.item;
                // (1,2) <- (2)
                await supplyChain.addInfoState(
                    itemCreationAction,
                    itemTwo,
                    [itemOne],
                    { from: operator1 },
                );
                // RootState(1) <- PartOf(2)
                await supplyChain.addPartOfState(
                    itemCreationAction,
                    itemOne,
                    itemTwo,
                    { from: owner1 },
                );
                // TransformState(2) <- HandoverState(2)
                await supplyChain.addHandoverState(
                    itemCreationAction,
                    itemTwo,
                    operatorRole2,
                    ownerRole2,
                    { from: owner1 },
                );
                // PartOf(2) <- operator(1) X
                await supplyChain.addInfoState(
                    itemCreationAction,
                    itemOne,
                    [],
                    { from: operator1 },
                );
            },
            'Not an operator of precedents.',
        );

        it('addPartOfState - sanity check.', async () => {
            // (1)
            transaction = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            );
            const itemOne = transaction.logs[0].args.item;
            const stateOne = transaction.logs[1].args.state;

            // (2)
            transaction = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            );
            const itemTwo = transaction.logs[0].args.item;
            const stateTwo = transaction.logs[1].args.state;

            // (1,2) <- (2)
            const stateThree = (
                await supplyChain.addInfoState(
                    itemCreationAction,
                    itemTwo,
                    [itemOne],
                    { from: operator1 },
                )
            ).logs[0].args.state;

            // (1) <- PartOf(2)
            transaction = (
                await supplyChain.addPartOfState(
                    itemCreationAction,
                    itemOne,
                    itemTwo,
                    { from: owner1 },
                )
            );
            const stateFour = transaction.logs[0].args.state;

            // (2) <- Handover(2)
            await supplyChain.addHandoverState(
                itemCreationAction,
                itemTwo,
                operatorRole2,
                ownerRole2,
                { from: owner1 },
            );

            assert.equal(itemOne.toNumber(), 1);
            assert.equal(stateTwo.toNumber(), 2);

            assert.equal(itemOne.toNumber(), 1);
            assert.equal(stateTwo.toNumber(), 2);
            assert.equal(stateThree.toNumber(), 3);
            assert.equal(stateFour.toNumber(), 4);

            assert.equal(
                (await supplyChain.getPrecedents(stateFour)).length,
                1,
            );
            assert.equal(
                (await supplyChain.getPrecedents(stateFour))[0].toNumber(),
                stateOne,
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
            await supplyChain.addInfoState(
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
            // RootState(1)
            const itemOne = (
                await supplyChain.addRootState(
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
            // RootState(1)
            const itemOne = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(2)
            const itemTwo = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // (1,2) <- (2)
            const stateThree = (
                await supplyChain.addInfoState(
                    itemCreationAction,
                    itemTwo,
                    [itemOne],
                    { from: operator1 },
                )
            ).logs[0].args.state;

            assert.equal(
                (await supplyChain.getPrecedents(stateThree)).length,
                2,
            );
            assert.equal(
                (await supplyChain.countParts(itemTwo)).toNumber(),
                0,
            );
        });

        it('getParts for an item with one part.', async () => {
            // RootState(1)
            const itemOne = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(2)
            const itemTwo = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // (1,2) <- (2)
            const stateThree = (
                await supplyChain.addInfoState(
                    itemCreationAction,
                    itemTwo,
                    [itemOne],
                    { from: operator1 },
                )
            ).logs[0].args.state;
            await supplyChain.addPartOfState(
                itemCreationAction,
                itemOne,
                itemTwo,
                { from: owner1 },
            );

            assert.equal(
                (await supplyChain.getPrecedents(stateThree)).length,
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
            // RootState(1)
            const itemOne = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(2)
            const itemTwo = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(3)
            const itemThree = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(1,2,3) <- TransformState(3)
            await supplyChain.addInfoState(
                itemCreationAction,
                itemThree,
                [itemOne, itemTwo],
                { from: operator1 },
            );
            await supplyChain.addPartOfState(
                itemCreationAction,
                itemOne,
                itemThree,
                { from: owner1 },
            );
            await supplyChain.addPartOfState(
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
            // RootState(1)
            const itemOne = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(2)
            const itemTwo = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(3)
            const itemThree = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // RootState(4)
            const itemFour = (
                await supplyChain.addRootState(
                    itemCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.item;
            // Item(1,2) <- AddInfo(1)
            await supplyChain.addInfoState(
                itemCreationAction,
                itemOne,
                [itemTwo],
                { from: operator1 },
            );
            await supplyChain.addPartOfState(
                itemCreationAction,
                itemTwo,
                itemOne,
                { from: owner1 },
            );
            // Item(1,3) <- AddInfo(1)
            await supplyChain.addInfoState(
                itemCreationAction,
                itemOne,
                [itemThree],
                { from: operator1 },
            );
            await supplyChain.addPartOfState(
                itemCreationAction,
                itemThree,
                itemOne,
                { from: owner1 },
            );
            // Item(1,4) <- AddInfo(1)
            await supplyChain.addInfoState(
                itemCreationAction,
                itemOne,
                [itemFour],
                { from: operator1 },
            );
            await supplyChain.addPartOfState(
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
