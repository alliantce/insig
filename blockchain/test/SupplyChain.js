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

    describe('Actions', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();
        });

        it('addAction creates a action.', async () => {
            productCreationDescription = 'Product line created.';

            transaction = await supplyChain.addAction(productCreationDescription, { from: root });

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, 'ActionCreated');
            assert.equal(transaction.logs[0].args.action.toNumber(), 1);

            assert.equal(
                await supplyChain.actionDescription(transaction.logs[0].args.action.toNumber()),
                productCreationDescription,
            );
            let totalActions = (await supplyChain.totalActions()).toNumber();
            assert.equal(
                totalActions,
                1,
            );

            itemCreationDescription = 'Instance';
            transaction = await supplyChain.addAction(itemCreationDescription, { from: root });

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, 'ActionCreated');
            assert.equal(transaction.logs[0].args.action.toNumber(), 2);

            assert.equal(
                await supplyChain.actionDescription(transaction.logs[0].args.action.toNumber()),
                itemCreationDescription,
            );
            totalActions = (await supplyChain.totalActions()).toNumber();
            assert.equal(
                totalActions,
                2,
            );
        });
    });

    describe('Steps as a graph', () => {
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

            transaction = await supplyChain.addInitialRole("OnlyRole");
            roleId = transaction.logs[0].args.role;
        });

        it('addStep creates a step.', async () => {
            const productZero = 100;
            const productOne = 101;

            const stepOne = (
                await supplyChain.addStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addStep(productCreationAction, productOne, [], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(stepOne, 1);
            assert.equal(stepTwo, 2);
        });

        it('addStep creates chains.', async () => {
            const productZero = 100;
            const itemZero = 200;

            const stepOne = (
                await supplyChain.addStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addStep(itemCreationAction, itemZero, [stepOne], roleId, roleId)
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.addStep(itemCertificationAction, itemZero, [stepTwo], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getPrecedents(stepTwo))[0].toNumber(),
                stepOne.toNumber(),
            );
            assert.equal(
                (await supplyChain.getPrecedents(stepThree))[0].toNumber(),
                stepTwo.toNumber(),
            );
        });

        it('addStep maintains lastSteps.', async () => {
            const itemZero = 200;

            const stepOne = (
                await supplyChain.addStep(itemCreationAction, itemZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addStep(itemCreationAction, itemZero, [stepOne], roleId, roleId)
            ).logs[0].args.step;

            assert.isFalse(
                (await supplyChain.isLastStep(10))
            );
            assert.isFalse(
                (await supplyChain.isLastStep(stepOne))
            );
            assert.isTrue(
                (await supplyChain.isLastStep(stepTwo))
            );
        });

        itShouldThrow(
            'append only on last steps',
            async () => {    
                const itemZero = 100;
    
                const stepOne = (
                    await supplyChain.addStep(itemCreationAction, itemZero, [], roleId, roleId)
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.addStep(itemCertificationAction, itemZero, [stepOne], roleId, roleId)
                ).logs[0].args.step;
                const stepThree = (
                    await supplyChain.addStep(itemCertificationAction, itemZero, [stepOne], roleId, roleId)
                ).logs[0].args.step;
            },
            'Append only on last steps.',
        );

        it('addStep allows multiple precedents.', async () => {
            const partZero = 200;
            const partOne = 201;
            const itemZero = 202;

            const stepOne = (
                await supplyChain.addStep(itemCreationAction, partZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addStep(itemCreationAction, partOne, [], roleId, roleId)
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.addStep(itemCreationAction, itemZero, [stepOne, stepTwo], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getPrecedents(stepThree))[0].toNumber(),
                stepOne.toNumber(),
            );
            assert.equal(
                (await supplyChain.getPrecedents(stepThree))[1].toNumber(),
                stepTwo.toNumber(),
            );
        });

        itShouldThrow(
            'item must be unique or the same as a direct precedent.',
            async () => {    
                const itemZero = 100;
    
                const stepOne = (
                    await supplyChain.addStep(itemCreationAction, itemZero, [], roleId, roleId)
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.addStep(itemCertificationAction, itemZero, [stepOne], roleId, roleId)
                ).logs[0].args.step;
                const stepThree = (
                    await supplyChain.addStep(itemCreationAction, itemZero, [], roleId, roleId)
                ).logs[0].args.step;
            },
            'Instance not valid.',
        );

        it('addStep records action.', async () => {
            const productZero = 100;
            const itemZero = 200;

            const stepOne = (
                await supplyChain.addStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addStep(itemCreationAction, itemZero, [stepOne], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.steps.call(stepOne)).action).toNumber(),
                productCreationAction.toNumber(),
            );
            assert.equal(
                ((await supplyChain.steps.call(stepTwo)).action).toNumber(),
                itemCreationAction.toNumber(),
            );
        });

        it('addStep records item.', async () => {
            const productZero = 100;
            const itemZero = 200;
            const certificationZero = 300;

            const stepOne = (
                await supplyChain.addStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addStep(itemCreationAction, itemZero, [stepOne], roleId, roleId)
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.addStep(certificationCreationAction, certificationZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepFour = (
                await supplyChain.addStep(itemCertificationAction, itemZero, [stepTwo, stepThree], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.steps.call(stepOne)).item).toNumber(),
                productZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepTwo)).item).toNumber(),
                itemZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepThree)).item).toNumber(),
                certificationZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepFour)).item).toNumber(),
                itemZero,
            );
        });

        it('lastSteps records item.', async () => {
            const productZero = 100;
            const itemZero = 200;
            const certificationZero = 300;

            const stepOne = (
                await supplyChain.addStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addStep(itemCreationAction, itemZero, [stepOne], roleId, roleId)
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.addStep(certificationCreationAction, certificationZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepFour = (
                await supplyChain.addStep(itemCertificationAction, itemZero, [stepTwo, stepThree], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.lastSteps.call(productZero))).toNumber(),
                stepOne,
            );
            assert.equal(
                ((await supplyChain.lastSteps.call(itemZero))).toNumber(),
                stepFour,
            );
            assert.equal(
                ((await supplyChain.lastSteps.call(certificationZero))).toNumber(),
                stepThree,
            );
        });

        it('addStep records step creator.', async () => {
            const productZero = 100;
            const itemZero = 200;
            const certificationZero = 300;

            const stepOne = (
                await supplyChain.addStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addStep(itemCreationAction, itemZero, [stepOne], roleId, roleId)
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.addStep(certificationCreationAction, certificationZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepFour = (
                await supplyChain.addStep(itemCertificationAction, itemZero, [stepTwo, stepThree], roleId, roleId)
            ).logs[0].args.step;

            const certifier = (await supplyChain.steps.call(stepThree)).creator;

            assert.equal(certifier, root);
        });
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

            transaction = await supplyChain.addInitialRole("Root", { from: root });
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
            'no precedents - appender must be in current step.',
            async () => {    
                const itemZero = 100;
    
                const stepOne = (
                    await supplyChain.addStep(itemCreationAction, itemZero, [], appender1, admin1, { from: root })
                ).logs[0].args.step;
            },
            'Creator not in appenders.',
        );

        // Check appender1 belongs to the appenders of all precedents.
        itShouldThrow(
            'has precedents - must be appender for all.',
            async () => {    
                const partZero = 200;
                const partOne = 201;
                const itemZero = 202;
                
                const stepOne = (
                    await supplyChain.addStep(itemCreationAction, partZero, [], appenderRole1, adminRole1, { from: appender1 })
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.addStep(itemCreationAction, partOne, [], appenderRole2, adminRole2, { from: appender2 })
                ).logs[0].args.step;
                
                const stepThree = (
                    await supplyChain.addStep(itemCreationAction, itemZero, [stepOne, stepTwo], appenderRole1, adminRole1, {from: appender1})
                ).logs[0].args.step;    
            },
            'Not an appender of precedents.',
        );

        // If permissions are different to a precedent with the same instance id check user belongs to its admins.
        itShouldThrow(
            'same instance id - only admins can change permissions.',
            async () => {    
                const partZero = 200;
                const partOne = 201;
                await supplyChain.addBearer(appender1, appenderRole2, { from: admin2 });


                const stepOne = (
                    await supplyChain.addStep(itemCreationAction, partZero, [], appenderRole1, adminRole1, { from: appender1 })
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.addStep(itemCreationAction, partOne, [], appenderRole2, adminRole2, { from: appender2 })
                ).logs[0].args.step;
                
                const stepThree = (
                    await supplyChain.addStep(itemCreationAction, partOne, [stepOne, stepTwo], appenderRole1, adminRole1, {from: appender1})
                ).logs[0].args.step;    
            },
            'Needs admin to change permissions.',
        );

        it('sanity check new item', async () => {
            const partZero = 200;
            const partOne = 201;
            const partTwo = 202;
            await supplyChain.addBearer(appender1, appenderRole2, { from: admin2 });


            const stepOne = (
                await supplyChain.addStep(itemCreationAction, partZero, [], appenderRole1, adminRole1, { from: appender1 })
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addStep(itemCreationAction, partOne, [], appenderRole2, adminRole2, { from: appender2 })
            ).logs[0].args.step;
            
            const stepThree = (
                await supplyChain.addStep(itemCreationAction, partTwo, [stepOne, stepTwo], appenderRole1, adminRole1, {from: appender1})
            ).logs[0].args.step;  
        });

        it('sanity check same item', async () => {
            const partZero = 200;
            const partOne = 201;
            await supplyChain.addBearer(appender1, appenderRole2, { from: admin2 });
            await supplyChain.addBearer(appender1, adminRole2, { from: root });

            const stepOne = (
                await supplyChain.addStep(
                    itemCreationAction, 
                    partZero, 
                    [], 
                    appenderRole1, 
                    adminRole1, 
                    { from: appender1 }
                )
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addStep(
                    itemCreationAction, 
                    partOne, 
                    [], 
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
                    appenderRole1, 
                    adminRole1, 
                    {from: appender1}
                )
            ).logs[0].args.step;
        });

        it('getComposite returns the immediate item for non-composites', async () => {
            const partZero = 200;
            const partOne = 201;
            await supplyChain.addBearer(appender1, appenderRole2, { from: admin2 });
            await supplyChain.addBearer(appender1, adminRole2, { from: root });


            const stepOne = (
                await supplyChain.addStep(
                    itemCreationAction, 
                    partZero, 
                    [], 
                    appenderRole1, 
                    adminRole1, 
                    { from: appender1 }
                )
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.addStep(
                    itemCreationAction, 
                    partOne, 
                    [], 
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
                    appenderRole1, 
                    adminRole1, 
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
    });
});
