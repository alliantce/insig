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

        it('newRole creates a role.', async () => {
            roleDescription = 'Role 1.';
            transaction = await rbac.newRole(roleDescription, 0, { from: user1 });

            assert.equal(transaction.logs.length, 2);
            assert.equal(transaction.logs[0].event, 'RoleCreated');
            assert.equal(transaction.logs[0].args.role.toNumber(), 0);
            assert.equal((await rbac.totalRoles()).toNumber(), 1);
        });

        it('memberOf returns false for non existing roles', async () => {
            assert.isFalse(await rbac.memberOf(user1, 0));
        });

        it('memberOf returns false for non existing memberships', async () => {
            roleDescription = 'Role 1.';
            transaction = await rbac.newRole(roleDescription, 0, { from: user1 });

            assert.isFalse(await rbac.memberOf(user2, 0));
        });

        it('newRole adds msg.sender as member', async () => {
            roleDescription = 'Role 1.';
            transaction = await rbac.newRole(roleDescription, 0, { from: user1 });

            assert.isTrue(await rbac.memberOf(user1, 0));
        });

        it('newRole doesn\'t add msg.sender as member if another role is given.', async () => {
            const roleZero = (
                await rbac.newRole('Role 0', 0, { from: user1 })
            ).logs[0].args.role;

            const roleOne = (
                await rbac.newRole('Role 1', 0, { from: user1 })
            ).logs[0].args.role;

            assert.isTrue(await rbac.memberOf(user1, roleZero));
            assert.isFalse(await rbac.memberOf(user1, roleOne));
        });

        itShouldThrow(
            'addMember throws on non existing roles',
            async () => {
                await rbac.addMember(user1, 0, { from: user1 });
            },
            'Role doesn\'t exist.',
        );

        itShouldThrow(
            'addMember throws on non authorized users',
            async () => {    
                await rbac.newRole(roleDescription, 0, { from: user1 });
                await rbac.addMember(user2, 0, { from: user2 });
            },
            'User not authorized to add members.',
        );

        it('addMember does nothing if the member already belongs to the role.', async () => {
            roleDescription = 'Role 1.';
            await rbac.newRole(roleDescription, 0, { from: user1 });
            transaction = await rbac.addMember(user1, 0, { from: user1 });

            assert.equal(transaction.logs.length, 0);
        });

        it('addMember adds a member to a role.', async () => {
            roleDescription = 'Role 1.';
            await rbac.newRole(roleDescription, 0, { from: user1 });
            await rbac.addMember(user2, 0, { from: user1 });
            assert.isTrue(await rbac.memberOf(user2, 0));
        });

        itShouldThrow(
            'removeMember throws on non existing roles',
            async () => {
                await rbac.removeMember(user1, 0, { from: user1 });
            },
            'Role doesn\'t exist.',
        );

        itShouldThrow(
            'removeMember throws on non authorized users',
            async () => {    
                await rbac.newRole(roleDescription, 0, { from: user1 });
                await rbac.removeMember(user2, 0, { from: user2 });
            },
            'User not authorized to remove members.',
        );

        it('removeMember does nothing if the member doesn\'t belong to the role.', async () => {
            roleDescription = 'Role 1.';
            await rbac.newRole(roleDescription, 0, { from: user1 });
            transaction = await rbac.removeMember(user2, 0, { from: user1 });

            assert.equal(transaction.logs.length, 0);
        });

        it('removeMember removes a member from a role.', async () => {
            roleDescription = 'Role 1.';
            await rbac.newRole(roleDescription, 0, { from: user1 });
            await rbac.addMember(user2, 0, { from: user1 });
            assert.isTrue(await rbac.memberOf(user2, 0));
            await rbac.removeMember(user2, 0, { from: user1 });
            assert.isFalse(await rbac.memberOf(user2, 0));
        });
    });
});
