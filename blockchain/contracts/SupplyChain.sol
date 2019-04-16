pragma solidity ^0.5.0;

// import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Supply Chain
 * @author Alberto Cuesta Canada
 * @notice Implements a basic compositional supply chain contract.
 */
contract SupplyChain {
    // using SafeMath for uint256;

    event ActionCreated(uint8 action);
    event StepCreated(uint256 step);

    /**
     * @notice Supply chain step data. By chaining these and not allowing them to be modified
     * afterwards we create an Acyclic Directed Graph.
     * @dev The step id is not stored in the Step itself because it is always previously available
     * to whoever looks for the step. The types of the struct members have been chosen for optimal
     * struct packing.
     * @param creator The creator of this step.
     * @param action The action of this step.
     * @param item The id of the object that this step refers to.
     * @param precedents The ids of the steps that precede this one in the supply chain.
     */
    struct Step {
        address creator;
        uint8 action;
        uint248 item;
        uint256[] precedents;
    }

    /**
     * @notice All steps are directly accessible through a mapping keyed by the step ids. Recursive
     * structs are not supported in solidity yet.
     */
    mapping(uint256 => Step) public steps;

    /** @notice Record of all items ever created. */
    int256[] public items;

    /**
     * @notice Step counter
     */
    uint256 public totalSteps;

    /**
     * @notice Mapping from item id to the last step in the lifecycle of that item.
     */
    mapping(uint256 => uint256) public lastSteps;

    /**
     * @notice The step actions, defined by their index in an array of their descriptions. Examples
     * could be Creation, Certification, Handover, Split, Merge, Destruction
     */
    string[] internal actions;

    /**
     * @notice The contract constructor, empty as of now.
     */
    // solium-disable-next-line no-empty-blocks
    constructor() public {
    }

    /**
     * @notice A method to create a new step action.
     * @param _actionDescription The description of the action being created.
     * @dev Product lines can be implemented with a step action that indicates the creation of a
     * product line that is a parent to all items of that product. The creation of an item
     * would also be its own step action, which would usually have as precedents a product line step
     * and other item steps for parts and materials. If implementing product lines as a step
     * action the item id could be thought of as the product id and retrieved from lastSteps
     * @return The action id.
     */
    function newAction(string memory _actionDescription)
        public
        returns(uint8)
    {
        require(actions.length < 256, "Maximum number of actions reached.");
        uint8 action = uint8(actions.push(_actionDescription)) - 1;
        emit ActionCreated(action);
        return action;
    }

    /**
     * @notice A method to retrieve the description for a action.
     * @param _action The identifier for the action.
     * @return The action description.
     */
    function actionDescription(uint8 _action)
        public
        view
        returns(string memory)
    {
        require(_action < actions.length, "Event action not recognized.");
        return actions[_action];
    }

    /**
     * @notice A method to return the number of actions created.
     * @return The number of actions created.
     */
    function totalActions()
        public
        view
        returns(uint8)
    {
        return uint8(actions.length);
    }

    /**
     * @notice A method to create a new supply chain step. The msg.sender is recorded as the creator
     * of the step, which might possibly mean creator of the underlying asset as well.
     * @param _item The item id that this step is for. This must be either the item 
     * of one of the steps in _previousSteps, or an item that has never been used before. 
     * @param _previousSteps An array of the step ids for steps considered to be predecessors to
     * this one. Often this would just mean that the event refers to the same asset as the event
     * pointed to, but for steps like Creation it could point to the parts this asset is made of.
     * @param _action The index for the step action as defined in the actions array.
     * @return The step id of the step created.
     */
    function newStep(uint8 _action, uint216 _item, uint256[] memory _previousSteps)
        public
        returns(uint256)
    {
        require(_action < actions.length, "Event action not recognized.");
        for (uint i = 0; i < _previousSteps.length; i++){
            require(isLastStep(_previousSteps[i]), "Append only on last steps.");
        }
        bool repeatInstance = false;
        for (uint i = 0; i < _previousSteps.length; i++){
            if (steps[_previousSteps[i]].item == _item) {
                repeatInstance = true;
                break;
            }
        }
        if (!repeatInstance){
            require(lastSteps[_item] == 0, "Instance not valid.");
        }
        items.push(_item);

        steps[totalSteps] = Step(
            msg.sender,
            _action,
            _item,
            _previousSteps
        );
        uint256 step = totalSteps;
        totalSteps += 1;
        lastSteps[_item] = step;
        emit StepCreated(step);
        return step;
    }

    /**
     * @notice A method to verify whether a step is the last of an item.
     * @param _step The step id of the step to verify.
     * @return Whether a step is the last of an item.
     */
    function isLastStep(uint256 _step)
        public
        view
        returns(bool)
    {
        return lastSteps[steps[_step].item] == _step;
    }

    /**
     * @notice A method to retrieve the immediate precedents of a step.
     * @param _step The step id of the step to retrieve precedents for.
     * @return An array with the step ids of the immediate precedents of the step given as a parameter.
     */
    function getPrecedents(uint256 _step)
        public
        view
        returns(uint256[] memory)
    {
        return steps[_step].precedents;
    }
}