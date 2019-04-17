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

        it('newAction creates a action.', async () => {
            productCreationDescription = 'Product line created.';

            transaction = await supplyChain.newAction(productCreationDescription, { from: root });
            // console.log("Cost: $" + transaction.receipt.gasUsed / 3500000);

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, 'ActionCreated');
            assert.equal(transaction.logs[0].args.action.toNumber(), 0);

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
            transaction = await supplyChain.newAction(itemCreationDescription, { from: root });

            assert.equal(transaction.logs.length, 1);
            assert.equal(transaction.logs[0].event, 'ActionCreated');
            assert.equal(transaction.logs[0].args.action.toNumber(), 1);

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
            transaction = await supplyChain.newAction(productCreationDescription);
            productCreationAction = transaction.logs[0].args.action;

            itemCreationDescription = 'Instance created.';
            transaction = await supplyChain.newAction(itemCreationDescription);
            itemCreationAction = transaction.logs[0].args.action;

            certificationCreationDescription = 'Certification created';
            transaction = await supplyChain.newAction(certificationCreationDescription);
            certificationCreationAction = transaction.logs[0].args.action;

            itemCertificationDescription = 'Instance certified';
            transaction = await supplyChain.newAction(itemCertificationDescription);
            itemCertificationAction = transaction.logs[0].args.action;

            transaction = await supplyChain.newRole("OnlyRole", 0);
            roleId = transaction.logs[0].args.role;
        });

        it('newStep creates a step.', async () => {
            const productZero = 100;
            const productOne = 101;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(productCreationAction, productOne, [], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(stepZero, 0);
            assert.equal(stepOne, 1);
        });

        it('newStep creates chains.', async () => {
            const productZero = 100;
            const itemZero = 200;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(itemCertificationAction, itemZero, [stepOne], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getPrecedents(stepOne))[0].toNumber(),
                stepZero.toNumber(),
            );
            assert.equal(
                (await supplyChain.getPrecedents(stepTwo))[0].toNumber(),
                stepOne.toNumber(),
            );
        });

        it('newStep maintains lastSteps.', async () => {
            const itemZero = 200;

            const stepZero = (
                await supplyChain.newStep(itemCreationAction, itemZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero], roleId, roleId)
            ).logs[0].args.step;

            assert.isFalse(
                (await supplyChain.isLastStep(10))
            );
            assert.isFalse(
                (await supplyChain.isLastStep(stepZero))
            );
            assert.isTrue(
                (await supplyChain.isLastStep(stepOne))
            );
        });

        itShouldThrow(
            'append only on last steps',
            async () => {    
                const itemZero = 100;
    
                const stepZero = (
                    await supplyChain.newStep(itemCreationAction, itemZero, [], roleId, roleId)
                ).logs[0].args.step;
                const stepOne = (
                    await supplyChain.newStep(itemCertificationAction, itemZero, [stepZero], roleId, roleId)
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.newStep(itemCertificationAction, itemZero, [stepZero], roleId, roleId)
                ).logs[0].args.step;
            },
            'Append only on last steps.',
        );

        it('newStep allows multiple precedents.', async () => {
            const partZero = 200;
            const partOne = 201;
            const itemZero = 202;

            const stepZero = (
                await supplyChain.newStep(itemCreationAction, partZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, partOne, [], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero, stepOne], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(
                (await supplyChain.getPrecedents(stepTwo))[0].toNumber(),
                stepZero.toNumber(),
            );
            assert.equal(
                (await supplyChain.getPrecedents(stepTwo))[1].toNumber(),
                stepOne.toNumber(),
            );
        });

        itShouldThrow(
            'item must be unique or the same as a direct precedent.',
            async () => {    
                const itemZero = 100;
    
                const stepZero = (
                    await supplyChain.newStep(itemCreationAction, itemZero, [], roleId, roleId)
                ).logs[0].args.step;
                const stepOne = (
                    await supplyChain.newStep(itemCertificationAction, itemZero, [stepZero], roleId, roleId)
                ).logs[0].args.step;
                const stepTwo = (
                    await supplyChain.newStep(itemCreationAction, itemZero, [], roleId, roleId)
                ).logs[0].args.step;
            },
            'Instance not valid.',
        );

        it('newStep records action.', async () => {
            const productZero = 100;
            const itemZero = 200;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.steps.call(stepZero)).action).toNumber(),
                productCreationAction.toNumber(),
            );
            assert.equal(
                ((await supplyChain.steps.call(stepOne)).action).toNumber(),
                itemCreationAction.toNumber(),
            );
        });

        it('newStep records item.', async () => {
            const productZero = 100;
            const itemZero = 200;
            const certificationZero = 300;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(certificationCreationAction, certificationZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.newStep(itemCertificationAction, itemZero, [stepOne, stepTwo], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.steps.call(stepZero)).item).toNumber(),
                productZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepOne)).item).toNumber(),
                itemZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepTwo)).item).toNumber(),
                certificationZero,
            );
            assert.equal(
                ((await supplyChain.steps.call(stepThree)).item).toNumber(),
                itemZero,
            );
        });

        it('lastSteps records item.', async () => {
            const productZero = 100;
            const itemZero = 200;
            const certificationZero = 300;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero], roleId, roleId)
            ).logs[0].args.step;
            const stepTwo = (
                await supplyChain.newStep(certificationCreationAction, certificationZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepThree = (
                await supplyChain.newStep(itemCertificationAction, itemZero, [stepOne, stepTwo], roleId, roleId)
            ).logs[0].args.step;

            assert.equal(
                ((await supplyChain.lastSteps.call(productZero))).toNumber(),
                stepZero,
            );
            assert.equal(
                ((await supplyChain.lastSteps.call(itemZero))).toNumber(),
                stepThree,
            );
            assert.equal(
                ((await supplyChain.lastSteps.call(certificationZero))).toNumber(),
                stepTwo,
            );
        });

        it('newStep records step creator.', async () => {
            const productZero = 100;
            const itemZero = 200;

            const stepZero = (
                await supplyChain.newStep(productCreationAction, productZero, [], roleId, roleId)
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, itemZero, [stepZero], roleId, roleId)
            ).logs[0].args.step;
            await supplyChain.addMember(appender1, roleId);
            const stepTwo = (
                await supplyChain.newStep(itemCertificationAction, itemZero, [stepOne], roleId, roleId, { from: appender1 })
            ).logs[0].args.step;
            const certifier = (await supplyChain.steps.call(stepTwo)).creator;

            assert.equal(certifier, appender1);
        });
    });

    describe('Item ownership', () => {
        beforeEach(async () => {
            supplyChain = await SupplyChain.new();

            productCreationDescription = 'Product line created.';
            transaction = await supplyChain.newAction(productCreationDescription);
            productCreationAction = transaction.logs[0].args.action;

            itemCreationDescription = 'Instance created.';
            transaction = await supplyChain.newAction(itemCreationDescription);
            itemCreationAction = transaction.logs[0].args.action;

            certificationCreationDescription = 'Certification created';
            transaction = await supplyChain.newAction(certificationCreationDescription);
            certificationCreationAction = transaction.logs[0].args.action;

            itemCertificationDescription = 'Instance certified';
            transaction = await supplyChain.newAction(itemCertificationDescription);
            itemCertificationAction = transaction.logs[0].args.action;

            transaction = await supplyChain.newRole("Root", 0, { from: root });
            rootRole = transaction.logs[0].args.role;

            transaction = await supplyChain.newRole("Admin1", rootRole);
            adminRole1 = transaction.logs[0].args.role;
            await supplyChain.addMember(admin1, adminRole1, { from: root });

            transaction = await supplyChain.newRole("Appender1", adminRole1);
            appenderRole1 = transaction.logs[0].args.role;
            await supplyChain.addMember(appender1, appenderRole1, { from: admin1 });

            transaction = await supplyChain.newRole("Admin2", rootRole);
            adminRole2 = transaction.logs[0].args.role;
            await supplyChain.addMember(admin2, adminRole2, { from: root });

            transaction = await supplyChain.newRole("Appender2", adminRole2);
            appenderRole2 = transaction.logs[0].args.role;
            await supplyChain.addMember(appender2, appenderRole2, { from: admin2 });
        });

        // If there are no precedents check appender1 belongs to appenders of the current step.
        itShouldThrow(
            'no precedents - appender must be in current step.',
            async () => {    
                const itemZero = 100;
    
                const stepZero = (
                    await supplyChain.newStep(itemCreationAction, itemZero, [], appender1, admin1, { from: root })
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
                
                const stepZero = (
                    await supplyChain.newStep(itemCreationAction, partZero, [], appenderRole1, adminRole1, { from: appender1 })
                ).logs[0].args.step;
                const stepOne = (
                    await supplyChain.newStep(itemCreationAction, partOne, [], appenderRole2, adminRole2, { from: appender2 })
                ).logs[0].args.step;
                
                const stepTwo = (
                    await supplyChain.newStep(itemCreationAction, itemZero, [stepZero, stepOne], appenderRole1, adminRole1, {from: appender1})
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
                await supplyChain.addMember(appender1, appenderRole2, { from: admin2 });


                const stepZero = (
                    await supplyChain.newStep(itemCreationAction, partZero, [], appenderRole1, adminRole1, { from: appender1 })
                ).logs[0].args.step;
                const stepOne = (
                    await supplyChain.newStep(itemCreationAction, partOne, [], appenderRole2, adminRole2, { from: appender2 })
                ).logs[0].args.step;
                
                const stepTwo = (
                    await supplyChain.newStep(itemCreationAction, partOne, [stepZero, stepOne], appenderRole1, adminRole1, {from: appender1})
                ).logs[0].args.step;    
            },
            'Needs admin to change permissions.',
        );

        it('sanity check new item', async () => {
            const partZero = 200;
            const partOne = 201;
            const partTwo = 202;
            await supplyChain.addMember(appender1, appenderRole2, { from: admin2 });


            const stepZero = (
                await supplyChain.newStep(itemCreationAction, partZero, [], appenderRole1, adminRole1, { from: appender1 })
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, partOne, [], appenderRole2, adminRole2, { from: appender2 })
            ).logs[0].args.step;
            
            const stepTwo = (
                await supplyChain.newStep(itemCreationAction, partTwo, [stepZero, stepOne], appenderRole1, adminRole1, {from: appender1})
            ).logs[0].args.step;    
        });

        it('sanity check same item', async () => {
            const partZero = 200;
            const partOne = 201;
            await supplyChain.addMember(appender1, appenderRole2, { from: admin2 });
            await supplyChain.addMember(appender1, adminRole2, { from: root });


            const stepZero = (
                await supplyChain.newStep(itemCreationAction, partZero, [], appenderRole1, adminRole1, { from: appender1 })
            ).logs[0].args.step;
            const stepOne = (
                await supplyChain.newStep(itemCreationAction, partOne, [], appenderRole2, adminRole2, { from: appender2 })
            ).logs[0].args.step;
            
            const stepTwo = (
                await supplyChain.newStep(itemCreationAction, partOne, [stepZero, stepOne], appenderRole1, adminRole1, {from: appender1})
            ).logs[0].args.step;    
        });
    });
});
