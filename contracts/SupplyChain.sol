pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Supply Chain
 * @author Alberto Cuesta Canada
 * @notice Implements a basic compositional supply chain contract.
 */
contract SupplyChain {
    using SafeMath for uint256;

    /**
     * @notice Step counter
     */
    uint256 lastStepId;

    /**
     * @notice Supply chain step data. By not chaining these and not allowing them to be modified 
     * we create an Acyclic Directed Graph. The step id is not stored in the Step itself because
     * it is always previously available to whoever looks for the step.
     */
    struct Step{
        uint256[] parents;
        address owner;
        uint8 class;
    }

    /**
     * @notice All steps are directly accessible through a mapping keyed by the step ids. Recursive
     * structs are not supported in solidity yet.
     */
    mapping(uint256 => Step) steps;

    /**
     * @notice The step classes, defined by their index in an array of their descriptions. Examples
     * could be Creation, Certification, Handover, Split, Merge, Destruction
     */
    string[] classes;
    
    /**
     * @notice The contract constructor, empty as of now.
     */
    constructor() 
        public
    {
    }

    /**
     * @notice A method to create a new step class.
     * @param _classDescription The description of the class being created.
     * @return The class id.
     */
    function newClass(string memory _classDescription)
        public
        returns(uint8)
    {
        require(classes.length < 256, "Maximum number of classes reached.");
        classes.push(_classDescription);
        return uint8(classes.length - 1);
    }

    /**
     * @notice A method to retrieve the description for a class.
     * @param _classId The identifier for the class.
     * @return The class description.
     */
    function classDescription(uint8 _classId)
        public
        returns(string memory)
    {
        require(_classId < classes.length, "Event class not recognized.");
        return classes[_classId];
    }

    /**
     * @notice A method to create a new supply chain step. The msg.sender is recorded as the owner
     * of the step, which might possibly mean owner of the underlying asset as well.
     * @param _previousSteps An array of the step ids for steps considered to be predecessors to
     * this one. Often this would just mean that the event refers to the same asset as the event
     * pointed to, but for steps like Creation it could point to the parts this asset is made of.
     * @param _class The index for the step class as defined in the classes array.
     * @return The step id of the step created.
     */
    function newStep(uint256[] memory _previousSteps, uint8 _class)
        public
        returns(uint256)
    {
        require(_class < classes.length, "Event class not recognized.");
        steps[lastStepId] = Step(_previousSteps, msg.sender, _class);
        lastStepId += 1;
        return lastStepId;
    }

    /**
     * @notice A method to retrieve the immediate parents of a step.
     * @param _stepId The step id of the step to retrieve parents for.
     * @return An array with the setp ids of the immediate parents of the step given as a parameter.
     */
    function getParents(uint256 _stepId)
        public
        view
        returns(uint256[] memory)
    {
        return steps[_stepId].parents;
    }

    /**
     * @notice A method to retrieve the owner of a step.
     * @param _stepId The step id of the step to retrieve the owner for.
     * @return The owner address for the step given as a parameter.
     */
    function getOwner(uint256 _stepId)
        public
        view
        returns(address)
    {
        return steps[_stepId].owner;
    }

    /**
     * @notice A method to retrieve the class of a step.
     * @param _stepId The step id of the step to retrieve the class for.
     * @return The class id for the step given as a parameter.
     */
    function getClass(uint256 _stepId)
        public
        view
        returns(uint8)
    {
        return steps[_stepId].class;
    }
}
