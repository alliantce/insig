pragma solidity ^0.5.0;

import "./../RBAC.sol";


/**
 * @title RBACGasTest
 * @author Alberto Cuesta Canada
 * @notice Allows to determine the gas use of view functions in RBAC.sol.
 */
contract RBACGasTest is RBAC {
    event HasRole(bool hasIt);
    event TotalRoles(uint256 roles);

    function gasTotalRoles()
        public
    {
        emit TotalRoles(totalRoles());
    }

    function gasHasRole(address _account, uint256 _role)
        public
    {
        emit HasRole(hasRole(_account, _role));
    }
}
