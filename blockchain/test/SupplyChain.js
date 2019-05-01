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
    const appender1 = accounts[1];
    const appender2 = accounts[2];
    const admin1 = accounts[3];
    const admin2 = accounts[4];

    before(async () => {
        supplyChain = await SupplyChain.deployed();
    });

    describe('Item ownership', () => {
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

            transaction = await supplyChain.addRole("Admin1", rootRole);
            adminRole1 = transaction.logs[0].args.role;
            await supplyChain.addBearer(admin1, adminRole1, { from: root });

            transaction = await supplyChain.addRole("Appender1", adminRole1);
            appenderRole1 = transaction.logs[0].args.role;
            await supplyChain.addBearer(appender1, appenderRole1, { from: admin1 });

            transaction = await supplyChain.addRole("Admin2", rootRole);
            adminRole2 = transaction.logs[0].args.role;
            await supplyChain.addBearer(admin2, adminRole2, { from: root });

            transaction = await supplyChain.addRole("Appender2", adminRole2);
            appenderRole2 = transaction.logs[0].args.role;
            await supplyChain.addBearer(appender2, appenderRole2, { from: admin2 });
        });

        // If there are no precedents check appender1 belongs to appenders of the current step.
        itShouldThrow(
            'addRootStep - appender must be in current step.',
            async () => {    
                const itemZero = 100;
    
                const stepOne = (
                    await supplyChain.addRootStep(itemCreationAction, itemZero, appender1, admin1, { from: root })
                ).logs[0].args.step;
            },
            'Creator not in appenders.',
        );

        // Check appender1 belongs to the appenders of all precedents.
        itShouldThrow(
            'addTransformStep - must be appender for all precedents.',
            async () => {    
                const partZero = 200;
                const partOne = 201;
                const itemZero = 202;
                
                const stepOne = (
                    await supplyChain.addRootStep(itemCreationAction, partZero, appenderRole1, adminRole1, { from: appender1 })
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.addRootStep(itemCreationAction, partOne, appenderRole2, adminRole2, { from: appender2 })
                ).logs[0].args.step;
                
                const stepThree = (
                    await supplyChain.addTransformStep(itemCreationAction, itemZero, [stepOne, stepTwo], {from: appender1})
                ).logs[0].args.step;    
            },
            'Not an appender of precedents.',
        );

        // If permissions are different to a precedent with the same instance id check user belongs to its admins.
        itShouldThrow(
            'addHandoverStep - only admins can change permissions.',
            async () => {    
                const partZero = 200;
                await supplyChain.addBearer(appender1, appenderRole2, { from: admin2 });


                const stepOne = (
                    await supplyChain.addRootStep(itemCreationAction, partZero, appenderRole1, adminRole1, { from: appender1 })
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.addHandoverStep(itemCreationAction, partZero, appenderRole2, adminRole2, {from: appender1})
                ).logs[0].args.step;    
            },
            'Needs admin for handover.',
        );

        it('sanity check addRootStep and addStep', async () => {
            const partZero = 200;
            const partOne = 201;
            await supplyChain.addBearer(appender1, appenderRole2, { from: admin2 });
            await supplyChain.addBearer(appender1, adminRole2, { from: root });

            const stepOne = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    partZero, 
                    appenderRole1, 
                    adminRole1, 
                    { from: appender1 }
                )
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    partOne, 
                    appenderRole2, 
                    adminRole2, 
                    { from: appender2 }
                )
            ).logs[0].args.step;
            
            const stepThree = (
                await supplyChain.addStep(
                    itemCreationAction, 
                    partOne, 
                    [stepOne, stepTwo], 
                    {from: appender1}
                )
            ).logs[0].args.step;
        });


        it('sanity check addTransformStep', async () => {
            const partZero = 200;
            const partOne = 201;
            const partTwo = 202;
            await supplyChain.addBearer(appender1, appenderRole2, { from: admin2 });


            const stepOne = (
                await supplyChain.addRootStep(itemCreationAction, partZero, appenderRole1, adminRole1, { from: appender1 })
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addRootStep(itemCreationAction, partOne, appenderRole2, adminRole2, { from: appender2 })
            ).logs[0].args.step;
            
            const stepThree = (
                await supplyChain.addTransformStep(itemCreationAction, partTwo, [stepOne, stepTwo], {from: appender1})
            ).logs[0].args.step;  
        });

        it('sanity check addHandoverStep', async () => {
            const partZero = 200;

            const stepOne = (
                await supplyChain.addRootStep(itemCreationAction, partZero, appenderRole1, adminRole1, { from: appender1 })
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addHandoverStep(itemCreationAction, partZero, appenderRole2, adminRole2, {from: admin1})
            ).logs[0].args.step;  
        });

        it('getComposite returns the immediate item for non-composites', async () => {
            const partZero = 200;
            const partOne = 201;
            await supplyChain.addBearer(appender1, appenderRole2, { from: admin2 });
            // await supplyChain.addBearer(appender1, adminRole2, { from: root });


            const stepOne = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    partZero, 
                    appenderRole1, 
                    adminRole1, 
                    { from: appender1 }
                )
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    partOne, 
                    appenderRole2, 
                    adminRole2, 
                    { from: appender2 }
                )
            ).logs[0].args.step;
            
            const stepThree = (
                await supplyChain.addStep(
                    itemCreationAction, 
                    partOne, 
                    [stepOne, stepTwo], 
                    {from: appender1}
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
                        appenderRole1, 
                        adminRole1, 
                        { from: appender1 }
                    )
                ).logs[0].args.step;
                // RootStep(1) <- PartOf(2) X
                const stepTwo = (
                    await supplyChain.addPartOfStep(
                        itemCreationAction, 
                        [stepOne],
                        itemTwo, 
                        {from: appender1}
                    )
                ).logs[0].args.step;
            },
            'Composite item does not exist.',
        );

        itShouldThrow(
            'addPartOfStep - Needs admin for partOf.',
            async () => {    
                const itemOne = 201;
                const itemTwo = 202;

                // RootStep(1)
                const stepOne = (
                    await supplyChain.addRootStep(
                        itemCreationAction, 
                        itemOne, 
                        appenderRole1, 
                        adminRole1, 
                        { from: appender1 }
                    )
                ).logs[0].args.step;
                // RootStep(1) <- TransformStep(2)
                const stepTwo = (
                    await supplyChain.addTransformStep(
                        itemCreationAction, 
                        itemTwo, 
                        [stepOne], 
                        {from: appender1}
                    )
                ).logs[0].args.step;
                // RootStep(1) <- PartOf(2) X
                const stepThree = (
                    await supplyChain.addPartOfStep(
                        itemCreationAction, 
                        [stepOne],
                        itemTwo, 
                        {from: appender1}
                    )
                ).logs[0].args.step;
            },
            'Needs admin for partOf.',
        );

        it('getComposite returns item pointed by partOf.', async () => {
            const itemOne = 201;
            const itemTwo = 202;

            // RootStep(1)
            const stepOne = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    itemOne, 
                    appenderRole1, 
                    adminRole1, 
                    { from: appender1 }
                )
            ).logs[0].args.step;
            // RootStep(1) <- TransformStep(2)
            const stepTwo = (
                await supplyChain.addTransformStep(
                    itemCreationAction, 
                    itemTwo, 
                    [stepOne], 
                    {from: appender1}
                )
            ).logs[0].args.step;
            // RootStep(1) <- PartOf(2)
            const stepThree = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    [stepOne],
                    itemTwo, 
                    {from: admin1}
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
                    appenderRole1, 
                    adminRole1, 
                    { from: appender1 }
                )
            ).logs[0].args.step;
            // RootStep(1) <- TransformStep(2)
            const stepTwo = (
                await supplyChain.addTransformStep(
                    itemCreationAction, 
                    itemTwo, 
                    [stepOne], 
                    {from: appender1}
                )
            ).logs[0].args.step;
            // RootStep(1) <- PartOf(2)
            const stepThree = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    [stepOne],
                    itemTwo, 
                    {from: admin1}
                )
            ).logs[0].args.step;
            // TransformStep(2) <- TransformStep(3)
            const stepFour = (
                await supplyChain.addTransformStep(
                    itemCreationAction, 
                    itemThree, 
                    [stepTwo], 
                    {from: appender1}
                )
            ).logs[0].args.step;
            // TransformStep(2) <- PartOf(3)
            const stepFive = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    [stepTwo],
                    itemThree, 
                    {from: admin1}
                )
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getComposite(stepThree)).toNumber(),
                itemThree,
            );
        });

        itShouldThrow(
            'addPartOfStep - derive appenders from composite.',
            async () => {
                const itemOne = 201;
                const itemTwo = 202;

                // RootStep(1)
                const stepOne = (
                    await supplyChain.addRootStep(
                        itemCreationAction, 
                        itemOne, 
                        appenderRole1, 
                        adminRole1, 
                        { from: appender1 }
                    )
                ).logs[0].args.step;
                // RootStep(1) <- TransformStep(2)
                const stepTwo = (
                    await supplyChain.addTransformStep(
                        itemCreationAction, 
                        itemTwo, 
                        [stepOne], 
                        {from: appender1}
                    )
                ).logs[0].args.step;
                // RootStep(1) <- PartOf(2)
                const stepThree = (
                    await supplyChain.addPartOfStep(
                        itemCreationAction, 
                        [stepOne],
                        itemTwo, 
                        {from: admin1}
                    )
                ).logs[0].args.step;
                // TransformStep(2) <- HandoverStep(2)
                const stepFour = (
                    await supplyChain.addHandoverStep(
                        itemCreationAction, 
                        itemTwo, 
                        appenderRole2, 
                        adminRole2, 
                        {from: admin1}
                    )
                ).logs[0].args.step; 
                // PartOf(2) <- Appender(1) X
                const stepFive = (
                    await supplyChain.addStep(
                        itemCreationAction, 
                        itemOne, 
                        [stepThree], 
                        {from: appender1}
                    )
                ).logs[0].args.step;
            },
            'Not an appender of precedents.',
        );

        it('addPartOfStep - sanity check.', async () => {
            const itemOne = 201;
            const itemTwo = 202;

            // RootStep(1)
            const stepOne = (
                await supplyChain.addRootStep(
                    itemCreationAction, 
                    itemOne, 
                    appenderRole1, 
                    adminRole1, 
                    { from: appender1 }
                )
            ).logs[0].args.step;
            // RootStep(1) <- TransformStep(2)
            const stepTwo = (
                await supplyChain.addTransformStep(
                    itemCreationAction, 
                    itemTwo, 
                    [stepOne], 
                    {from: appender1}
                )
            ).logs[0].args.step;
            // RootStep(1) <- PartOf(2)
            const stepThree = (
                await supplyChain.addPartOfStep(
                    itemCreationAction, 
                    [stepOne],
                    itemTwo, 
                    {from: admin1}
                )
            ).logs[0].args.step;
            // TransformStep(2) <- HandoverStep(2)
            const stepFour = (
                await supplyChain.addHandoverStep(
                    itemCreationAction, 
                    itemTwo, 
                    appenderRole2, 
                    adminRole2, 
                    {from: admin1}
                )
            ).logs[0].args.step; 
            // PartOf(2) <- Appender(2)
            const stepFive = (
                await supplyChain.addStep(
                    itemCreationAction, 
                    itemOne, 
                    [stepThree],
                    {from: appender2}
                )
            ).logs[0].args.step;
        });
    });
})
