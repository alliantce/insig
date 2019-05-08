const SupplyChain = artifacts.require('./SupplyChain.sol');
const Token = artifacts.require('./Token.sol');

const chai = require('chai');
const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('Token', (accounts) => {
    let supplyChain;
    let token;
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
        token = await Token.deployed();
    });

    describe('Mint', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();
            token = await Token.new(supplyChain.address);

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
            'Fails if minter not in ownerRole.',
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
                        { from: operator1 }
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

                await token.mint(
                    operator1,
                    itemOne,
                    100,
                    { from: operator1 },
                );
            },
            'Minter not in ownerRole.',
        );

        itShouldThrow(
            'Fails if token for composite not instantiated.',
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
                        { from: operator1 }
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

                await token.mint(
                    operator1,
                    itemOne,
                    100,
                    { from: owner1 },
                );
            },
            'Instantiate composite first.',
        );

        it('Instantiates a token for a simple item', async () => {
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

            await token.mint(
                owner1,
                itemOne,
                100,
                { from: owner1 },
            );
            assert.equal(
                (await token.ownerOf(itemOne)),
                owner1,
            );
            assert.equal(
                (await token.faceValue.call(itemOne)).toNumber(),
                100,
            );
        });

        it('Instantiates a token for a composite item', async () => {
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
                    { from: operator1 }
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

            await token.mint(
                owner1,
                itemTwo,
                100,
                { from: owner1 },
            );
            await token.mint(
                owner1,
                itemOne,
                50,
                { from: owner1 },
            );

            assert.equal(
                (await token.ownerOf(itemOne)),
                owner1,
            );
            assert.equal(
                (await token.faceValue.call(itemOne)).toNumber(),
                50,
            );
            assert.equal(
                (await token.ownerOf(itemTwo)),
                owner1,
            );
            assert.equal(
                (await token.faceValue.call(itemTwo)).toNumber(),
                100,
            );
        });

        itShouldThrow(
            'Fails token for composite is instantiated but doesn\'t belong to owner',
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
                        { from: operator1 }
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
    
                await token.mint(
                    owner1,
                    itemTwo,
                    100,
                    { from: owner1 },
                );
                await token.transferFrom(
                    owner1,
                    owner2,
                    itemTwo,
                    { from: owner1 },
                );
                await token.mint(
                    owner1,
                    itemOne,
                    50,
                    { from: owner1 },
                );
            },
            'Not owner of composite token.',
        );
    });

    describe('Burn', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();
            token = await Token.new(supplyChain.address);

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
            'Fails if burner not in ownerRole.',
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

                await token.mint(
                    owner1,
                    itemOne,
                    100,
                    { from: owner1 },
                );
                await token.burn(
                    itemOne,
                    { from: owner2 },
                );
            },
            'Burner not in ownerRole.',
        );

        itShouldThrow(
            'Fails if item has parts with instantiated tokens.',
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
                // TransformStep(2) <- RootStep(1)
                const stepTwo = (
                    await supplyChain.addTransformStep(
                        itemCreationAction, 
                        itemTwo,
                        [itemOne], 
                        { from: operator1 }
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

                await token.mint(
                    owner1,
                    itemTwo,
                    100,
                    { from: owner1 },
                );
                await token.mint(
                    owner1,
                    itemOne,
                    50,
                    { from: owner1 },
                );
                await token.burn(
                    itemTwo,
                    { from: owner1 },
                );
            },
            'Burn part tokens first.',
        );

        it('Burns a token for a simple item', async () => {
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

            await token.mint(
                owner1,
                itemOne,
                100,
                { from: owner1 },
            );
            assert.equal(
                (await token.ownerOf(itemOne)),
                owner1,
            );
            assert.equal(
                (await token.faceValue.call(itemOne)).toNumber(),
                100,
            );
            await token.burn(
                itemOne,
                { from: owner1 },
            );
            assert.equal(
                (await token.exists(itemOne)),
                false,
            );
            assert.equal(
                (await token.faceValue.call(itemOne)).toNumber(),
                0,
            );
        });
    });
})
