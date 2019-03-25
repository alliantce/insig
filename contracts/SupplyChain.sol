pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Supply Chain
 * @author Alberto Cuesta Canada
 * @notice Implements a basic compositional supply chain contract.
 */
contract SupplyChain {
    using SafeMath for uint256;

    uint256 lastStepId;

    struct Step{
        uint256[] parents;
        address owner;
        uint8 class;
    }

    string[] classes;
    mapping(uint256 => Step) steps;

    constructor() 
        public
    {
    }

    function newStep(uint256[] memory _previousSteps, uint8 _class)
        public
        returns(uint256)
    {
        require(_class < classes.length, "Event class not recognized.");
        steps[lastStepId] = Step(_previousSteps, msg.sender, _class);
        lastStepId += 1;
        return lastStepId;
    }

    function getParents(uint256 _step)
        public
        view
        returns(uint256[] memory)
    {
        return steps[_step].parents;
    }

    function getOwner(uint256 _step)
        public
        view
        returns(address)
    {
        return steps[_step].owner;
    }

    function newClass(string memory _classDescription)
        public
        returns(uint8)
    {
        require(classes.length < 256, "Maximum number of classes reached.");
        classes.push(_classDescription);
        return uint8(classes.length - 1);
    }

    function classDescription(uint8 _class)
        public
        returns(string memory)
    {
        require(_class < classes.length, "Event class not recognized.");
        return classes[_class];
    }

    function getClass(uint256 _step)
        public
        view
        returns(uint8)
    {
        return steps[_step].class;
    }
}
