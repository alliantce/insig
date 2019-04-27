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

        it('addRole creates a role.', async () => {
            roleDescription = 'Role 1.';
            transaction = await rbac.addRole(roleDescription, 0, { from: user1 });

            assert.equal(transaction.logs.length, 2);
            assert.equal(transaction.logs[0].event, 'RoleCreated');
            assert.equal(transaction.logs[0].args.role.toNumber(), 0);
            assert.equal((await rbac.totalRoles()).toNumber(), 1);
        });

        it('hasRole returns false for non existing roles', async () => {
            assert.isFalse(await rbac.hasRole(user1, 0));
        });

        it('hasRole returns false for non existing memberships', async () => {
            roleDescription = 'Role 1.';
            transaction = await rbac.addRole(roleDescription, 0, { from: user1 });

            assert.isFalse(await rbac.hasRole(user2, 0));
        });

        it('addRole adds msg.sender as member', async () => {
            roleDescription = 'Role 1.';
            transaction = await rbac.addRole(roleDescription, 0, { from: user1 });

            assert.isTrue(await rbac.hasRole(user1, 0));
        });

        it('addRole doesn\'t add msg.sender as member if another role is given.', async () => {
            const roleZero = (
                await rbac.addRole('Role 0', 0, { from: user1 })
            ).logs[0].args.role;

            const roleOne = (
                await rbac.addRole('Role 1', 0, { from: user1 })
            ).logs[0].args.role;

            assert.isTrue(await rbac.hasRole(user1, roleZero));
            assert.isFalse(await rbac.hasRole(user1, roleOne));
        });

        itShouldThrow(
            'addBearer throws on non existing roles',
            async () => {
                await rbac.addBearer(user1, 0, { from: user1 });
            },
            'Role doesn\'t exist.',
        );

        itShouldThrow(
            'addBearer throws on non authorized users',
            async () => {    
                await rbac.addRole(roleDescription, 0, { from: user1 });
                await rbac.addBearer(user2, 0, { from: user2 });
            },
            'User not authorized to add members.',
        );

        it('addBearer does nothing if the member already belongs to the role.', async () => {
            roleDescription = 'Role 1.';
            await rbac.addRole(roleDescription, 0, { from: user1 });
            transaction = await rbac.addBearer(user1, 0, { from: user1 });

            assert.equal(transaction.logs.length, 0);
        });

        it('addBearer adds a member to a role.', async () => {
            roleDescription = 'Role 1.';
            await rbac.addRole(roleDescription, 0, { from: user1 });
            await rbac.addBearer(user2, 0, { from: user1 });
            assert.isTrue(await rbac.hasRole(user2, 0));
        });

        itShouldThrow(
            'removeBearer throws on non existing roles',
            async () => {
                await rbac.removeBearer(user1, 0, { from: user1 });
            },
            'Role doesn\'t exist.',
        );

        itShouldThrow(
            'removeBearer throws on non authorized users',
            async () => {    
                await rbac.addRole(roleDescription, 0, { from: user1 });
                await rbac.removeBearer(user2, 0, { from: user2 });
            },
            'User not authorized to remove members.',
        );

        it('removeBearer does nothing if the member doesn\'t belong to the role.', async () => {
            roleDescription = 'Role 1.';
            await rbac.addRole(roleDescription, 0, { from: user1 });
            transaction = await rbac.removeBearer(user2, 0, { from: user1 });

            assert.equal(transaction.logs.length, 0);
        });

        it('removeBearer removes a member from a role.', async () => {
            roleDescription = 'Role 1.';
            await rbac.addRole(roleDescription, 0, { from: user1 });
            await rbac.addBearer(user2, 0, { from: user1 });
            assert.isTrue(await rbac.hasRole(user2, 0));
            await rbac.removeBearer(user2, 0, { from: user1 });
            assert.isFalse(await rbac.hasRole(user2, 0));
        });
    });
});
