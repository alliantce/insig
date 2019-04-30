pragma solidity ^0.5.0;


/**
 * @title RBAC
 * @author Alberto Cuesta Canada
 * @notice Implements runtime configurable Role Based Access Control.
 */
contract RBAC {
    event RoleCreated(uint256 role);
    event BearerAdded(address account, uint256 role);
    event BearerRemoved(address account, uint256 role);

    uint256 constant NO_ROLE = 0;

    /**
     * @notice A role, which will be used to group users.
     * @dev The role id is its position in the roles array.
     * @param description A description for the role.
     * @param admin The only role that can add or remove bearers from this role. To have the role
     * bearers to be also the role admins you should pass roles.length as the admin role.
     * @param bearers Addresses belonging to this role.
     */
    struct Role {
        string description;
        uint256 admin;
        address[] bearers;
    }

    /**
     * @notice All roles ever created.
     */
    Role[] public roles;

    /**
     * @notice The contract constructor, empty as of now.
     */
    constructor() public {
        addRole("NO_ROLE", NO_ROLE);
    }

    /**
     * @notice A method to create a new role.
     * @dev If the _admin parameter is the id of the newly created role 
     * msg.sender is added to it automatically.
     * @param _roleDescription The description of the role being created.
     * @param _admin The role that is allowed to add and remove bearers from 
     * the role being created.
     * @return The role id.
     */
    function addRole(string memory _roleDescription, uint256 _admin)
        public
        returns(uint256)
    {
        require(_admin <= roles.length, "Admin role doesn't exist.");
        uint256 role = roles.push(
            Role({
                description: _roleDescription, 
                admin: _admin, 
                bearers: new address[](0)
            })
        ) - 1;
        emit RoleCreated(role);
        if (_admin == role) {
            roles[role].bearers.push(msg.sender);
            emit BearerAdded(msg.sender, role);
        }
        return role;
    }

    /**
     * @notice A method to retrieve the number of roles in the contract.
     * @dev The zero position in the roles array is reserved for NO_ROLE and doesn't count towards
     * this total.
     */
    function totalRoles()
        public
        view
        returns(uint256)
    {
        return roles.length - 1;
    }

    /**
     * @notice A method to verify whether an account is a bearer of a role
     * @param _account The account to verify.
     * @param _role The role to look into.
     * @return Whether the account is a bearer of the role.
     */
    function hasRole(address _account, uint256 _role)
        public
        view
        returns(bool)
    {
        if (_role >= roles.length ) return false;
        address[] memory _bearers = roles[_role].bearers;
        for (uint256 i = 0; i < _bearers.length; i++){
            if (_bearers[i] == _account) return true;
        }
        return false;
    }

    /**
     * @notice A method to add a bearer to a role
     * @param _account The account to add as a bearer.
     * @param _role The role to add the bearer to.
     */
    function addBearer(address _account, uint256 _role)
        public
    {
        require(
            _role < roles.length,
            "Role doesn't exist."
        );
        require(
            hasRole(msg.sender, roles[_role].admin),
            "User not authorized to add bearers."
        );
        if (hasRole(_account, _role) == false){
            roles[_role].bearers.push(_account);
            emit BearerAdded(_account, _role);
        }
    }

    /**
     * @notice A method to remove a bearer from a role
     * @param _account The account to remove as a bearer.
     * @param _role The role to remove the bearer from.
     */
    function removeBearer(address _account, uint256 _role)
        public
    {
        require(
            _role < roles.length,
            "Role doesn't exist."
        );
        require(
            hasRole(msg.sender, roles[_role].admin),
            "User not authorized to remove bearers."
        );
        address[] memory _bearers = roles[_role].bearers;
        for (uint256 i = 0; i < _bearers.length; i++){
            if (_bearers[i] == _account){
                _bearers[i] = _bearers[_bearers.length - 1];
                roles[_role].bearers.pop();
                emit BearerRemoved(_account, _role);
            }
        }
    }
}
