const RBAC = artifacts.require('./RBAC.sol');
const RBACGasTest = artifacts.require('./test/RBACGasTest.sol');

const chai = require('chai');
const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('RBAC', (accounts) => {
    let rbac;
    let rbacGasTest;
    let transaction;
    const user1 = accounts[1];
    const user2 = accounts[2];

    before(async () => {
        rbac = await RBAC.deployed();
    });

    describe('RBAC', () => {
        beforeEach(async () => {
            rbac = await RBAC.new();
            rbacGasTest = await RBACGasTest.new();
        });

        it('addRootRole creates a role.', async () => {
            const roleDescription = 'Role 1.';
            transaction = await rbac.addRootRole(roleDescription, { from: user1 });

            assert.equal(transaction.logs.length, 2);
            assert.equal(transaction.logs[0].event, 'RoleCreated');
            assert.equal(transaction.logs[0].args.role.toNumber(), 1);
            assert.equal((await rbac.totalRoles()).toNumber(), 1);
        });

        it('hasRole returns false for NO_ROLE', async () => {
            assert.isFalse(await rbac.hasRole(user1, 0));
        });

        it('hasRole returns false for non existing roles', async () => {
            assert.isFalse(await rbac.hasRole(user1, 1));
        });

        it('hasRole returns false for non existing bearerships', async () => {
            const roleDescription = 'Role 1.';
            transaction = await rbac.addRootRole(roleDescription, { from: user1 });

            assert.isFalse(await rbac.hasRole(user2, transaction.logs[0].args.role));
        });


        it('hasRole gas test', async () => {
            const roleDescription = 'Role 1.';
            const roleId = (
                await rbac.addRootRole(roleDescription, { from: user1 })
            ).logs[0].args.role;

            for (let i = 2; i < 6; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                await rbac.addBearer(accounts[i], roleId, { from: user1 });
            }
            for (let i = 0; i < 10; i += 1) {
                // eslint-disable-next-line no-await-in-loop
                transaction = await rbacGasTest.gasHasRole(accounts[i], roleId);
            }
        });

        it('addRootRole adds msg.sender as bearer', async () => {
            const roleDescription = 'Role 1.';
            transaction = await rbac.addRootRole(roleDescription, { from: user1 });

            assert.isTrue(await rbac.hasRole(user1, transaction.logs[0].args.role));
        });

        itShouldThrow(
            'addRole requires an existing admin role.',
            async () => {
                const roleDescription = 'Role 1.';
                const adminRole = (await rbac.totalRoles()).toNumber() + 1;
                await rbac.addRole(roleDescription, adminRole, { from: user1 });
            },
            'Admin role doesn\'t exist.',
        );

        it('addRole doesn\'t add msg.sender as bearer if another role is given.', async () => {
            const roleOne = (
                await rbac.addRootRole('Role 1', { from: user1 })
            ).logs[0].args.role;

            const roleTwo = (
                await rbac.addRole('Role 2', roleOne, { from: user1 })
            ).logs[0].args.role;

            assert.isTrue(await rbac.hasRole(user1, roleOne));
            assert.isFalse(await rbac.hasRole(user1, roleTwo));
        });

        itShouldThrow(
            'addBearer throws on non existing roles',
            async () => {
                const roleId = (await rbac.totalRoles()).toNumber() + 1;
                await rbac.addBearer(user1, roleId, { from: user1 });
            },
            'Role doesn\'t exist.',
        );

        itShouldThrow(
            'addBearer throws on non authorized users',
            async () => {
                const roleDescription = 'Role 1.';
                const roleId = (
                    await rbac.addRootRole(roleDescription, { from: user1 })
                ).logs[0].args.role;
                await rbac.addBearer(user2, roleId, { from: user2 });
            },
            'User can\'t add bearers.',
        );

        itShouldThrow(
            'addBearer throws if the bearer already belongs to the role.',
            async () => {
                const roleDescription = 'Role 1.';
                const roleId = (
                    await rbac.addRootRole(roleDescription, { from: user1 })
                ).logs[0].args.role;
                await rbac.addBearer(user1, roleId, { from: user1 });
            },
            'Account is bearer of role.',
        );

        it('addBearer adds a bearer to a role.', async () => {
            const roleDescription = 'Role 1.';
            const roleId = (
                await rbac.addRootRole(roleDescription, { from: user1 })
            ).logs[0].args.role;
            await rbac.addBearer(user2, roleId, { from: user1 });
            assert.isTrue(await rbac.hasRole(user2, roleId));
        });

        itShouldThrow(
            'removeBearer throws on non existing roles',
            async () => {
                await rbac.removeBearer(user1, 1, { from: user1 });
            },
            'Role doesn\'t exist.',
        );

        itShouldThrow(
            'removeBearer throws on non authorized users',
            async () => {
                const roleDescription = 'Role 1.';
                const roleId = (
                    await rbac.addRootRole(roleDescription, { from: user1 })
                ).logs[0].args.role;
                await rbac.removeBearer(user2, roleId, { from: user2 });
            },
            'User can\'t remove bearers.',
        );

        itShouldThrow(
            'removeBearer throws if the bearer doesn\'t belong to the role.',
            async () => {
                const roleDescription = 'Role 1.';
                const roleId = (
                    await rbac.addRootRole(roleDescription, { from: user1 })
                ).logs[0].args.role;
                await rbac.removeBearer(user2, roleId, { from: user1 });
            },
            'Account is not bearer of role.',
        );

        it('removeBearer removes a bearer from a role.', async () => {
            const roleDescription = 'Role 1.';
            const roleId = (
                await rbac.addRootRole(roleDescription, { from: user1 })
            ).logs[0].args.role;
            await rbac.addBearer(user2, roleId, { from: user1 });
            assert.isTrue(await rbac.hasRole(user2, roleId));
            await rbac.removeBearer(user2, roleId, { from: user1 });
            assert.isFalse(await rbac.hasRole(user2, roleId));
        });
    });
});
