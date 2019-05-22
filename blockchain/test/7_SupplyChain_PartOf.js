const SupplyChain = artifacts.require('./SupplyChain.sol');

const chai = require('chai');
const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('SupplyChain', (accounts) => {
    let supplyChain;
    // let productCreationAction;
    let productCreationDescription;
    let assetCreationAction;
    let assetCreationDescription;
    // let assetCertificationAction;
    let assetCertificationDescription;
    // let certificationCreationAction;
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
            // productCreationAction = transaction.logs[0].args.action;

            assetCreationDescription = 'Instance created.';
            transaction = await supplyChain.addAction(assetCreationDescription);
            assetCreationAction = transaction.logs[0].args.action;

            certificationCreationDescription = 'Certification created';
            transaction = await supplyChain.addAction(certificationCreationDescription);
            // certificationCreationAction = transaction.logs[0].args.action;

            assetCertificationDescription = 'Instance certified';
            transaction = await supplyChain.addAction(assetCertificationDescription);
            // assetCertificationAction = transaction.logs[0].args.action;

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

        it('getComposite returns the immediate asset for non-composites', async () => {
            await supplyChain.addBearer(operator1, operatorRole2, { from: owner2 });
            // await supplyChain.addBearer(operator1, ownerRole2, { from: root });


            const assetOne = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            const assetTwo = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole2,
                    ownerRole2,
                    { from: owner2 },
                )
            ).logs[0].args.asset;

            await supplyChain.addInfoState(
                assetCreationAction,
                assetOne,
                [assetTwo],
                { from: operator1 },
            );

            assert.equal(
                (await supplyChain.getComposite(assetOne)).toNumber(),
                assetOne,
            );
            assert.equal(
                (await supplyChain.getComposite(assetTwo)).toNumber(),
                assetTwo,
            );
            assert.equal(
                (await supplyChain.getComposite(assetTwo)).toNumber(),
                assetTwo,
            );
        });

        it('getComposite returns asset pointed by partOf.', async () => {
            // RootState(1)
            const assetOne = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(2)
            const assetTwo = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(1), RootState(2) <- InfoState(2)
            await supplyChain.addInfoState(
                assetCreationAction,
                assetTwo,
                [assetOne],
                { from: operator1 },
            );
            // RootState(1) <- PartOf(2)
            await supplyChain.addPartOfState(
                assetCreationAction,
                [assetOne],
                assetTwo,
                { from: owner1 },
            );

            assert.equal(
                (await supplyChain.getComposite(assetOne)).toNumber(),
                assetTwo,
            );
        });

        it('getComposite returns asset pointed by partOf recursively.', async () => {
            // RootState(1)
            const assetOne = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(2)
            const assetTwo = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(1,2) <- InfoState(2)
            await supplyChain.addInfoState(
                assetCreationAction,
                assetTwo,
                [assetOne],
                { from: operator1 },
            );
            // RootState(1) <- PartOf(2)
            await supplyChain.addPartOfState(
                assetCreationAction,
                assetOne,
                assetTwo,
                { from: owner1 },
            );
            // RootState(3)
            const assetThree = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // (2,3) <- (3)
            await supplyChain.addInfoState(
                assetCreationAction,
                assetThree,
                [assetTwo],
                { from: operator1 },
            );
            // (2) <- PartOf(3)
            await supplyChain.addPartOfState(
                assetCreationAction,
                assetTwo,
                assetThree,
                { from: owner1 },
            );

            assert.equal(
                (await supplyChain.getComposite(assetOne)).toNumber(),
                assetThree,
            );
        });

        itShouldThrow(
            'addPartOfState - Asset must exist.',
            async () => {
                // RootState(1) <- PartOf(2) X
                await supplyChain.addPartOfState(
                    assetCreationAction,
                    1,
                    1,
                    { from: owner1 },
                );
            },
            'Asset does not exist.',
        );

        itShouldThrow(
            'addPartOfState - Composite asset must exist.',
            async () => {
                // RootState(1)
                const assetOne = (
                    await supplyChain.addRootState(
                        assetCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.asset;
                // RootState(1) <- PartOf(2) X
                await supplyChain.addPartOfState(
                    assetCreationAction,
                    assetOne,
                    2,
                    { from: owner1 },
                );
            },
            'Composite asset does not exist.',
        );

        itShouldThrow(
            'addPartOfState - Needs owner for partOf.',
            async () => {
                // RootState(1)
                const assetOne = (
                    await supplyChain.addRootState(
                        assetCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.asset;
                // RootState(2)
                const assetTwo = (
                    await supplyChain.addRootState(
                        assetCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.asset;
                // (1,2) <- (2)
                await supplyChain.addInfoState(
                    assetCreationAction,
                    assetTwo,
                    [assetOne],
                    { from: operator1 },
                );
                // (1) <- PartOf(2) X
                await supplyChain.addPartOfState(
                    assetCreationAction,
                    assetOne,
                    assetTwo,
                    { from: operator1 },
                );
            },
            'Needs owner for partOf.',
        );

        itShouldThrow(
            'addPartOfState - Asset must be precedent of partOf.',
            async () => {
                // RootState(1)
                const assetOne = (
                    await supplyChain.addRootState(
                        assetCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.asset;
                // RootState(2)
                const assetTwo = (
                    await supplyChain.addRootState(
                        assetCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.asset;
                // RootState(1) <- PartOf(2) X
                await supplyChain.addPartOfState(
                    assetCreationAction,
                    assetOne,
                    assetTwo,
                    { from: owner1 },
                );
            },
            'Asset not precedent of partOf.',
        );

        itShouldThrow(
            'addPartOfState - derive operatorRole from composite.',
            async () => {
                // RootState(1)
                const assetOne = (
                    await supplyChain.addRootState(
                        assetCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.asset;
                // RootState(2)
                const assetTwo = (
                    await supplyChain.addRootState(
                        assetCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.asset;
                // (1,2) <- (2)
                await supplyChain.addInfoState(
                    assetCreationAction,
                    assetTwo,
                    [assetOne],
                    { from: operator1 },
                );
                // RootState(1) <- PartOf(2)
                await supplyChain.addPartOfState(
                    assetCreationAction,
                    assetOne,
                    assetTwo,
                    { from: owner1 },
                );
                // TransformState(2) <- HandoverState(2)
                await supplyChain.addHandoverState(
                    assetCreationAction,
                    assetTwo,
                    operatorRole2,
                    ownerRole2,
                    { from: owner1 },
                );
                // PartOf(2) <- operator(1) X
                await supplyChain.addInfoState(
                    assetCreationAction,
                    assetOne,
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
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            );
            const assetOne = transaction.logs[0].args.asset;
            const stateOne = transaction.logs[1].args.state;

            // (2)
            transaction = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            );
            const assetTwo = transaction.logs[0].args.asset;
            const stateTwo = transaction.logs[1].args.state;

            // (1,2) <- (2)
            const stateThree = (
                await supplyChain.addInfoState(
                    assetCreationAction,
                    assetTwo,
                    [assetOne],
                    { from: operator1 },
                )
            ).logs[0].args.state;

            // (1) <- PartOf(2)
            transaction = (
                await supplyChain.addPartOfState(
                    assetCreationAction,
                    assetOne,
                    assetTwo,
                    { from: owner1 },
                )
            );
            const stateFour = transaction.logs[0].args.state;

            // (2) <- Handover(2)
            await supplyChain.addHandoverState(
                assetCreationAction,
                assetTwo,
                operatorRole2,
                ownerRole2,
                { from: owner1 },
            );

            assert.equal(assetOne.toNumber(), 1);
            assert.equal(stateTwo.toNumber(), 2);

            assert.equal(assetOne.toNumber(), 1);
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
                (await supplyChain.getPartOf(assetOne)).toNumber(),
                assetTwo,
            );

            assert.equal(
                (await supplyChain.getOperatorRole(assetOne)).toNumber(),
                operatorRole2,
            );
            assert.equal(
                (await supplyChain.getOwnerRole(assetOne)).toNumber(),
                ownerRole2,
            );

            // Test part removal

            // (1) <- (1)
            await supplyChain.addInfoState(
                assetCreationAction,
                assetOne,
                [],
                { from: operator2 },
            );

            assert.equal(
                (await supplyChain.getPartOf(assetOne)).toNumber(),
                0,
            );
        });

        it('getParts for an asset without parts.', async () => {
            // RootState(1)
            const assetOne = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;

            assert.equal(
                (await supplyChain.countParts(assetOne)).toNumber(),
                0,
            );
        });

        it('getParts ignores precedents that are not parts.', async () => {
            // RootState(1)
            const assetOne = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(2)
            const assetTwo = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // (1,2) <- (2)
            const stateThree = (
                await supplyChain.addInfoState(
                    assetCreationAction,
                    assetTwo,
                    [assetOne],
                    { from: operator1 },
                )
            ).logs[0].args.state;

            assert.equal(
                (await supplyChain.getPrecedents(stateThree)).length,
                2,
            );
            assert.equal(
                (await supplyChain.countParts(assetTwo)).toNumber(),
                0,
            );
        });

        it('getParts for an asset with one part.', async () => {
            // RootState(1)
            const assetOne = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(2)
            const assetTwo = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // (1,2) <- (2)
            const stateThree = (
                await supplyChain.addInfoState(
                    assetCreationAction,
                    assetTwo,
                    [assetOne],
                    { from: operator1 },
                )
            ).logs[0].args.state;
            await supplyChain.addPartOfState(
                assetCreationAction,
                assetOne,
                assetTwo,
                { from: owner1 },
            );

            assert.equal(
                (await supplyChain.getPrecedents(stateThree)).length,
                2,
            );
            assert.equal(
                (await supplyChain.countParts(assetTwo)).toNumber(),
                1,
            );
            assert.equal(
                (await supplyChain.getParts(assetTwo))[0].toNumber(),
                assetOne,
            );
        });

        it('getParts for an asset with two parts.', async () => {
            // RootState(1)
            const assetOne = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(2)
            const assetTwo = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(3)
            const assetThree = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(1,2,3) <- TransformState(3)
            await supplyChain.addInfoState(
                assetCreationAction,
                assetThree,
                [assetOne, assetTwo],
                { from: operator1 },
            );
            await supplyChain.addPartOfState(
                assetCreationAction,
                assetOne,
                assetThree,
                { from: owner1 },
            );
            await supplyChain.addPartOfState(
                assetCreationAction,
                assetTwo,
                assetThree,
                { from: owner1 },
            );

            assert.equal(
                (await supplyChain.countParts(assetThree)).toNumber(),
                2,
            );
            assert.equal(
                (await supplyChain.getParts(assetThree))[0].toNumber(),
                assetOne,
            );
            assert.equal(
                (await supplyChain.getParts(assetThree))[1].toNumber(),
                assetTwo,
            );
        });

        it('getParts going deep.', async () => {
            // RootState(1)
            const assetOne = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(2)
            const assetTwo = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(3)
            const assetThree = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // RootState(4)
            const assetFour = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            // Asset(1,2) <- AddInfo(1)
            await supplyChain.addInfoState(
                assetCreationAction,
                assetOne,
                [assetTwo],
                { from: operator1 },
            );
            await supplyChain.addPartOfState(
                assetCreationAction,
                assetTwo,
                assetOne,
                { from: owner1 },
            );
            // Asset(1,3) <- AddInfo(1)
            await supplyChain.addInfoState(
                assetCreationAction,
                assetOne,
                [assetThree],
                { from: operator1 },
            );
            await supplyChain.addPartOfState(
                assetCreationAction,
                assetThree,
                assetOne,
                { from: owner1 },
            );
            // Asset(1,4) <- AddInfo(1)
            await supplyChain.addInfoState(
                assetCreationAction,
                assetOne,
                [assetFour],
                { from: operator1 },
            );
            await supplyChain.addPartOfState(
                assetCreationAction,
                assetFour,
                assetOne,
                { from: owner1 },
            );

            assert.equal(
                (await supplyChain.countParts(assetOne)).toNumber(),
                3,
            );
            assert.equal(
                (await supplyChain.getParts(assetOne))[0].toNumber(),
                assetFour,
            );
            assert.equal(
                (await supplyChain.getParts(assetOne))[1].toNumber(),
                assetThree,
            );
            assert.equal(
                (await supplyChain.getParts(assetOne))[2].toNumber(),
                assetTwo,
            );
        });
    });
});
