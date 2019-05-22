const SupplyChain = artifacts.require('./SupplyChain.sol');
const Token = artifacts.require('./Token.sol');

const chai = require('chai');
const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('Token', (accounts) => {
    let supplyChain;
    let token;
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
        token = await Token.deployed();
    });

    describe('Mint', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();
            token = await Token.new(supplyChain.address);

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

        itShouldThrow(
            'Fails if minter not in ownerRole.',
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
                    { from: owner1 },
                );

                await token.mint(
                    operator1,
                    assetOne,
                    100,
                    { from: operator1 },
                );
            },
            'Minter not in ownerRole.',
        );

        itShouldThrow(
            'Fails if token for composite not instantiated.',
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
                    { from: owner1 },
                );

                await token.mint(
                    operator1,
                    assetOne,
                    100,
                    { from: owner1 },
                );
            },
            'Instantiate composite first.',
        );

        it('Instantiates a token for a simple asset', async () => {
            // RootState(1)
            const assetOne = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;

            await token.mint(
                owner1,
                assetOne,
                100,
                { from: owner1 },
            );
            assert.equal(
                (await token.ownerOf(assetOne)),
                owner1,
            );
            assert.equal(
                (await token.faceValue.call(assetOne)).toNumber(),
                100,
            );
        });

        it('Instantiates a token for a composite asset', async () => {
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
            // RootState(1) <- PartOf(2) X
            await supplyChain.addPartOfState(
                assetCreationAction,
                assetOne,
                assetTwo,
                { from: owner1 },
            );

            await token.mint(
                owner1,
                assetTwo,
                100,
                { from: owner1 },
            );
            await token.mint(
                owner1,
                assetOne,
                50,
                { from: owner1 },
            );

            assert.equal(
                (await token.ownerOf(assetOne)),
                owner1,
            );
            assert.equal(
                (await token.faceValue.call(assetOne)).toNumber(),
                50,
            );
            assert.equal(
                (await token.ownerOf(assetTwo)),
                owner1,
            );
            assert.equal(
                (await token.faceValue.call(assetTwo)).toNumber(),
                100,
            );
        });

        itShouldThrow(
            'Fails token for composite is instantiated but doesn\'t belong to owner',
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
                // RootState(1) <- PartOf(2) X
                await supplyChain.addPartOfState(
                    assetCreationAction,
                    assetOne,
                    assetTwo,
                    { from: owner1 },
                );

                await token.mint(
                    owner1,
                    assetTwo,
                    100,
                    { from: owner1 },
                );
                await token.transferFrom(
                    owner1,
                    owner2,
                    assetTwo,
                    { from: owner1 },
                );
                await token.mint(
                    owner1,
                    assetOne,
                    50,
                    { from: owner1 },
                );
            },
            'Not owner of composite token.',
        );

        itShouldThrow(
            'Fails if face value higher than composite\'s',
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
                    { from: owner1 },
                );

                await token.mint(
                    owner1,
                    assetTwo,
                    100,
                    { from: owner1 },
                );
                await token.mint(
                    owner1,
                    assetOne,
                    150,
                    { from: owner1 },
                );
            },
            'Face value exceeds available.',
        );

        itShouldThrow(
            'Fails if face value higher than composite + parts',
            async () => {
                // (1)
                const assetOne = (
                    await supplyChain.addRootState(
                        assetCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.asset;
                // (2)
                const assetTwo = (
                    await supplyChain.addRootState(
                        assetCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.asset;
                // (3)
                const assetThree = (
                    await supplyChain.addRootState(
                        assetCreationAction,
                        operatorRole1,
                        ownerRole1,
                        { from: owner1 },
                    )
                ).logs[0].args.asset;
                // (1,2,3) <- (3)
                await supplyChain.addInfoState(
                    assetCreationAction,
                    assetThree,
                    [assetOne, assetTwo],
                    { from: operator1 },
                );
                // (1) <- PartOf(3)
                await supplyChain.addPartOfState(
                    assetCreationAction,
                    assetOne,
                    assetThree,
                    { from: owner1 },
                );
                // (2) <- PartOf(3)
                await supplyChain.addPartOfState(
                    assetCreationAction,
                    assetTwo,
                    assetThree,
                    { from: owner1 },
                );

                await token.mint(
                    owner1,
                    assetThree,
                    100,
                    { from: owner1 },
                );
                await token.mint(
                    owner1,
                    assetOne,
                    50,
                    { from: owner1 },
                );
                await token.mint(
                    owner1,
                    assetTwo,
                    51,
                    { from: owner1 },
                );
            },
            'Face value exceeds available.',
        );
    });

    describe('Burn', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();
            token = await Token.new(supplyChain.address);

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

        itShouldThrow(
            'Fails if burner not in ownerRole.',
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

                await token.mint(
                    owner1,
                    assetOne,
                    100,
                    { from: owner1 },
                );
                await token.burn(
                    assetOne,
                    { from: owner2 },
                );
            },
            'Burner not in ownerRole.',
        );

        itShouldThrow(
            'Fails if asset has parts with instantiated tokens.',
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
                    { from: owner1 },
                );

                await token.mint(
                    owner1,
                    assetTwo,
                    100,
                    { from: owner1 },
                );
                await token.mint(
                    owner1,
                    assetOne,
                    50,
                    { from: owner1 },
                );
                await token.burn(
                    assetTwo,
                    { from: owner1 },
                );
            },
            'Burn part tokens first.',
        );

        it('Burns a token for a simple asset', async () => {
            // RootState(1)
            const assetOne = (
                await supplyChain.addRootState(
                    assetCreationAction,
                    operatorRole1,
                    ownerRole1,
                    { from: owner1 },
                )
            ).logs[0].args.asset;
            await token.mint(
                owner1,
                assetOne,
                100,
                { from: owner1 },
            );
            assert.equal(
                (await token.ownerOf(assetOne)),
                owner1,
            );
            assert.equal(
                (await token.faceValue.call(assetOne)).toNumber(),
                100,
            );
            await token.burn(
                assetOne,
                { from: owner1 },
            );
            assert.equal(
                (await token.exists(assetOne)),
                false,
            );
            assert.equal(
                (await token.faceValue.call(assetOne)).toNumber(),
                0,
            );
        });
    });
});
