pragma solidity ^0.5.0;


/**
 * @title RBAC
 * @author Alberto Cuesta Canada
 * @notice Implements runtime configurable Role Based Access Control.
 */
contract RBAC {
    event RoleCreated(uint256 role);
    event MemberAdded(address account, uint256 role);
    event MemberRemoved(address account, uint256 role);

    /**
     * @notice A role, which will be used to group users.
     * @dev The role id is its position in the roles array.
     * @param description A description for the role.
     * @param admin The role that can add or remove users from the role.
     */
    struct Role {
        string description;
        uint256 admin;
    }

    /**
     * @notice All roles ever created.
     */
    Role[] public roles;

    /**
     * @notice Memberships of users to roles.
     */
    mapping(uint256 => address[]) public memberships;

    /**
     * @notice The contract constructor, empty as of now.
     */
    // solium-disable-next-line no-empty-blocks
    constructor() public {
    }

    /**
     * @notice A method to create a new role.
     * @dev If the _admin parameter is the id of the newly created role 
     * msg.sender is added to it automatically.
     * @param _roleDescription The description of the role being created.
     * @param _admin The role that is allowed to add and remove members from 
     * the role being created.
     * @return The role id.
     */
    function newRole(string memory _roleDescription, uint256 _admin)
        public
        returns(uint256)
    {
        require(_admin <= roles.length, "Admin role doesn't exist.");
        uint256 role = roles.push(Role(_roleDescription, _admin)) - 1;
        emit RoleCreated(role);
        if (_admin == role) {
            memberships[role].push(msg.sender);
            emit MemberAdded(msg.sender, role);
        }
        return role;
    }

    function totalRoles()
        public
        view
        returns(uint256)
    {
        return roles.length;
    }

    /**
     * @notice A method to verify whether an account is a member of a role
     * @param _account The account to verify.
     * @param _role The role to look into.
     * @return Whether the account is a member of the role.
     */
    function memberOf(address _account, uint256 _role)
        public
        view
        returns(bool)
    {
        address[] memory members = memberships[_role];
        for (uint256 i = 0; i < members.length; i++){
            if (members[i] == _account) return true;
        }
        return false;
    }

    /**
     * @notice A method to add a member to a role
     * @param _account The account to add as a member.
     * @param _role The role to add the member to.
     */
    function addMember(address _account, uint256 _role)
        public
    {
        require(
            _role < roles.length,
            "Role doesn't exist."
        );
        require(
            memberOf(msg.sender, roles[_role].admin),
            "User not authorized to add members."
        );
        if (memberOf(_account, _role) == false){
            memberships[_role].push(_account);
            emit MemberAdded(_account, _role);
        }
    }

    /**
     * @notice A method to remove a member from a role
     * @param _account The account to remove as a member.
     * @param _role The role to remove the member from.
     */
    function removeMember(address _account, uint256 _role)
        public
    {
        require(
            _role < roles.length,
            "Role doesn't exist."
        );
        require(
            memberOf(msg.sender, roles[_role].admin),
            "User not authorized to remove members."
        );
        address[] memory members = memberships[_role];
        for (uint256 i = 0; i < members.length; i++){
            if (members[i] == _account){
                members[i] = members[members.length - 1];
                memberships[_role].pop();
                emit MemberRemoved(_account, _role);
            }
        }
    }
}
