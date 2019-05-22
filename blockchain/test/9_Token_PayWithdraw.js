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
    // let certificationCreationAction;
    let certificationCreationDescription;
    // let assetCertificationAction;
    let assetCertificationDescription;
    let transaction;
    const root = accounts[0];
    const operator1 = accounts[1];
    const operator2 = accounts[2];
    const owner1 = accounts[3];
    const owner2 = accounts[4];
    let rootRole;
    let ownerRole1;
    let operatorRole1;
    let ownerRole2;
    let operatorRole2;

    before(async () => {
        supplyChain = await SupplyChain.deployed();
        token = await Token.deployed();
    });

    describe('Pay', () => {
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
            'Fails with no tokens.',
            async () => {
                await token.pay(
                    1,
                    100,
                    { from: root },
                );
            },
            'Token doesn\'t exist.',
        );

        it('Pays for a simple token.', async () => {
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

            const { amount } = (
                await token.pay(
                    assetOne,
                    200,
                    { from: root },
                )
            ).logs[0].args;

            assert.equal(
                (await token.ownerOf(assetOne)),
                owner1,
            );
            assert.equal(
                (await token.revenues.call(assetOne)).toNumber(),
                200,
            );
            assert.equal(
                amount.toNumber(),
                200,
            );
        });

        it('Pays a token for a composite asset', async () => {
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
            await token.pay(
                assetTwo,
                400,
                { from: root },
            );

            assert.equal(
                (await token.revenues.call(assetOne)).toNumber(),
                200,
            );
            assert.equal(
                (await token.revenues.call(assetTwo)).toNumber(),
                200,
            );
        });

        it('Ignores non-parts when paying.', async () => {
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
            await token.pay(
                assetThree,
                400,
                { from: root },
            );

            assert.equal(
                (await token.revenues.call(assetOne)).toNumber(),
                200,
            );
            assert.equal(
                (await token.revenues.call(assetThree)).toNumber(),
                200,
            );
        });

        it('Pays to multiple parts.', async () => {
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
            // RootState(2)
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
            // RootState(1) <- PartOf(3) X
            await supplyChain.addPartOfState(
                assetCreationAction,
                assetOne,
                assetThree,
                { from: owner1 },
            );
            // RootState(2) <- PartOf(3) X
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
                20,
                { from: owner1 },
            );
            await token.mint(
                owner1,
                assetTwo,
                30,
                { from: owner1 },
            );
            await token.pay(
                assetThree,
                400,
                { from: root },
            );

            assert.equal(
                (await token.revenues.call(assetThree)).toNumber(),
                200,
            );
            assert.equal(
                (await token.revenues.call(assetTwo)).toNumber(),
                120,
            );
            assert.equal(
                (await token.revenues.call(assetOne)).toNumber(),
                80,
            );
        });

        it('Pays in multiple part levels.', async () => {
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
            // (1,2) <- (2)
            await supplyChain.addInfoState(
                assetCreationAction,
                assetTwo,
                [assetOne],
                { from: operator1 },
            );
            // (1) <- PartOf(2)
            await supplyChain.addPartOfState(
                assetCreationAction,
                assetOne,
                assetTwo,
                { from: owner1 },
            );

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

            await token.mint(
                owner1,
                assetThree,
                200,
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
                30,
                { from: owner1 },
            );

            await token.pay(
                assetThree,
                800,
                { from: root },
            );

            assert.equal(
                (await token.revenues.call(assetThree)).toNumber(),
                400,
            );
            assert.equal(
                (await token.revenues.call(assetTwo)).toNumber(),
                280,
            );
            assert.equal(
                (await token.revenues.call(assetOne)).toNumber(),
                120,
            );
        });
    });
});
