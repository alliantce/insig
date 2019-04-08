pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Supply Chain
 * @author Alberto Cuesta Canada
 * @notice Implements a basic compositional supply chain contract.
 */
contract SupplyChain {
    using SafeMath for uint256;

    event ClassCreated(uint8 classId);
    event StepCreated(uint256 stepId);

    /**
     * @notice Supply chain step data. By chaining these and not allowing them to be modified
     * afterwards we create an Acyclic Directed Graph.
     * @dev The step id is not stored in the Step itself because it is always previously available
     * to whoever looks for the step. The types of the struct members have been chosen for optimal
     * struct packing.
     * @param owner The creator of this step.
     * @param class The class of this step.
     * @param instance The id of the object that this step refers to.
     * @param parents The ids of the steps that precede this one in the supply chain.
     */
    struct Step {
        address owner;
        uint8 class;
        uint216 instance;
        uint256[] parents;
    }

    /**
     * @notice All steps are directly accessible through a mapping keyed by the step ids. Recursive
     * structs are not supported in solidity yet.
     */
    mapping(uint256 => Step) public steps;

    /**
     * @notice Step counter
     */
    uint256 public totalSteps;

    /**
     * @notice Mapping from instance id to the last step in the lifecycle of that instance.
     */
    mapping(uint256 => uint256) public lastSteps;

    /**
     * @notice The step classes, defined by their index in an array of their descriptions. Examples
     * could be Creation, Certification, Handover, Split, Merge, Destruction
     */
    string[] internal classes;

    /**
     * @notice The contract constructor, empty as of now.
     */
    // solium-disable-next-line no-empty-blocks
    constructor() public {
    }

    /**
     * @notice A method to create a new step class.
     * @param _classDescription The description of the class being created.
     * @dev Product lines can be implemented with a step class that indicates the creation of a
     * product line that is a parent to all instances of that product. The creation of an instance
     * would also be its own step class, which would usually have as parents a product line step
     * and other instance steps for parts and materials. If implementing product lines as a step
     * class the instance id could be thought of as the product id and retrieved from lastSteps
     * @return The class id.
     */
    function newClass(string memory _classDescription)
        public
        returns(uint8)
    {
        require(classes.length < 256, "Maximum number of classes reached.");
        uint8 classId = uint8(classes.push(_classDescription)) - 1;
        emit ClassCreated(classId);
        return classId;
    }

    /**
     * @notice A method to retrieve the description for a class.
     * @param _classId The identifier for the class.
     * @return The class description.
     */
    function classDescription(uint8 _classId)
        public
        view
        returns(string memory)
    {
        require(_classId < classes.length, "Event class not recognized.");
        return classes[_classId];
    }

    /**
     * @notice A method to return the number of classes created.
     * @return The number of classes created.
     */
    function totalClasses()
        public
        view
        returns(uint8)
    {
        return uint8(classes.length);
    }

    /**
     * @notice A method to create a new supply chain step. The msg.sender is recorded as the owner
     * of the step, which might possibly mean owner of the underlying asset as well.
     * @param _instanceId The instance id that this step is for.
     * @param _previousSteps An array of the step ids for steps considered to be predecessors to
     * this one. Often this would just mean that the event refers to the same asset as the event
     * pointed to, but for steps like Creation it could point to the parts this asset is made of.
     * @param _classId The index for the step class as defined in the classes array.
     * @return The step id of the step created.
     */
    function newStep(uint8 _classId, uint216 _instanceId, uint256[] memory _previousSteps)
        public
        returns(uint256)
    {
        require(_classId < classes.length, "Event class not recognized.");
        for (uint i = 0; i < _previousSteps.length; i++){
            require(isLastStep(_previousSteps[i]), "Append only on last steps.");
        }
        steps[totalSteps] = Step(
            msg.sender,
            _classId,
            _instanceId,
            _previousSteps
        );
        uint256 stepId = totalSteps;
        totalSteps += 1;
        lastSteps[_instanceId] = stepId;
        emit StepCreated(stepId);
        return stepId;
    }

    /**
     * @notice A method to verify whether a step is the last of an instance.
     * @param _stepId The step id of the step to verify.
     * @return Whether a step is the last of an instance.
     */
    function isLastStep(uint256 _stepId)
        public
        view
        returns(bool)
    {
        return lastSteps[steps[_stepId].instance] == _stepId;
    }

    /**
     * @notice A method to retrieve the immediate parents of a step.
     * @param _stepId The step id of the step to retrieve parents for.
     * @return An array with the step ids of the immediate parents of the step given as a parameter.
     */
    function getParents(uint256 _stepId)
        public
        view
        returns(uint256[] memory)
    {
        return steps[_stepId].parents;
    }
}
