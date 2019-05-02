const RBAC = artifacts.require('./RBAC.sol');

const chai = require('chai');
const { itShouldThrow } = require('./utils');
// use default BigNumber
chai.use(require('chai-bignumber')()).should();

contract('RBAC', (accounts) => {
    let rbac;
    let transaction;
    const user1 = accounts[1];
    const user2 = accounts[2];

    before(async () => {
        rbac = await RBAC.deployed();
    });

    describe('RBAC', () => {
        beforeEach(async () => {
            rbac = await RBAC.new();
        });

        it('addRootRole creates a role.', async () => {
            roleDescription = 'Role 1.';
            transaction = await rbac.addRootRole(roleDescription, { from: user1 });

            assert.equal(transaction.logs.length, 2);
            assert.equal(transaction.logs[0].event, 'RoleCreated');
            assert.equal(transaction.logs[0].args.role.toNumber(), 1);
            assert.equal((await rbac.totalRoles()).toNumber(), 1);
        });

        it('hasRole returns false for non existing roles', async () => {
            assert.isFalse(await rbac.hasRole(user1, 0));
        });

        it('hasRole returns false for non existing bearerships', async () => {
            roleDescription = 'Role 1.';
            transaction = await rbac.addRootRole(roleDescription, { from: user1 });

            assert.isFalse(await rbac.hasRole(user2, transaction.logs[0].args.role));
        });

        it('addRootRole adds msg.sender as bearer', async () => {
            roleDescription = 'Role 1.';
            transaction = await rbac.addRootRole(roleDescription, { from: user1 });

            assert.isTrue(await rbac.hasRole(user1, transaction.logs[0].args.role));
        });

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
                roleId = (await rbac.totalRoles()).toNumber() + 1;
                await rbac.addBearer(user1, roleId, { from: user1 });
            },
            'Role doesn\'t exist.',
        );

        itShouldThrow(
            'addBearer throws on non authorized users',
            async () => {    
                const roleId = (
                    await rbac.addRootRole(roleDescription, { from: user1 })
                ).logs[0].args.role;
                await rbac.addBearer(user2, roleId, { from: user2 });
            },
            'User not authorized to add bearers.',
        );

        it('addBearer does nothing if the bearer already belongs to the role.', async () => {
            roleDescription = 'Role 1.';
            const roleId = (
                await rbac.addRootRole(roleDescription, { from: user1 })
            ).logs[0].args.role;
            transaction = await rbac.addBearer(user1, roleId, { from: user1 });

            assert.equal(transaction.logs.length, 0);
        });

        it('addBearer adds a bearer to a role.', async () => {
            roleDescription = 'Role 1.';
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
                const roleId = (
                    await rbac.addRootRole(roleDescription, { from: user1 })
                ).logs[0].args.role;
                await rbac.removeBearer(user2, roleId, { from: user2 });
            },
            'User not authorized to remove bearers.',
        );

        it('removeBearer does nothing if the bearer doesn\'t belong to the role.', async () => {
            roleDescription = 'Role 1.';
            const roleId = (
                await rbac.addRootRole(roleDescription, { from: user1 })
            ).logs[0].args.role;
            transaction = await rbac.removeBearer(user2, roleId, { from: user1 });

            assert.equal(transaction.logs.length, 0);
        });

        it('removeBearer removes a bearer from a role.', async () => {
            roleDescription = 'Role 1.';
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
