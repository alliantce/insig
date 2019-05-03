pragma solidity ^0.5.0;

import "./RBAC.sol";


/**
 * @title Supply Chain
 * @author Alberto Cuesta Canada
 * @notice Implements a basic compositional supply chain contract.
 */
contract SupplyChain is RBAC {

    uint256 constant NO_ACTION = 0;
    uint256 constant NO_ITEM = 0;
    uint256 constant NO_PARTOF = NO_ITEM;
    uint256 constant NO_STEP = 0;

    event ActionCreated(uint256 action);
    event StepCreated(uint256 step);
    event debug(uint256 x);

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
     * @param partOf The id of some other item that this is part of and inherits permissions from.
     * @param operatorRole The roles allowed to append steps to this one.
     * @param ownerRole The roles allowed to append steps with different permissions.
     */
    struct Step {
        address creator;
        uint256 action;
        uint256 item;
        uint256[] precedents;
        uint256 partOf;
        uint256 operatorRole;
        uint256 ownerRole;
    }

    /**
     * @notice All steps are directly accessible through a mapping keyed by the step ids. Recursive
     * structs are not supported in solidity yet.
     */
    Step[] public steps;

    /**
     * @notice The step actions, defined by their index in an array of their descriptions. Examples
     * could be Creation, Certification, Handover, Split, Merge, Destruction
     */
    string[] internal actions;

    /** 
     * @notice Item counter 
     */
    uint256 public totalItems;

    /**
     * @notice Mapping from item id to the last step in the lifecycle of that item.
     */
    mapping(uint256 => uint256) public lastSteps;

    /**
     * @notice The contract constructor, empty as of now.
     */
    constructor() public {
        addAction("NO ACTION");
        uint256[] memory emptyArray;
        steps.push(
            Step(address(0), 0, 0, emptyArray, 0, 0, 0)
        );
    }

    /**
     * @notice Create a new step action.
     * @param _actionDescription The description of the action being created.
     * @dev Product lines can be implemented with a step action that indicates the creation of a
     * product line that is a parent to all items of that product. The creation of an item
     * would also be its own step action, which would usually have as precedents a product line step
     * and other item steps for parts and materials. If implementing product lines as a step
     * action the item id could be thought of as the product id and retrieved from lastSteps
     * @return The action id.
     */
    function addAction(string memory _actionDescription)
        public
        returns(uint256)
    {
        uint256 action = actions.push(_actionDescription) - 1;
        emit ActionCreated(action);
        return action;
    }

    /**
     * @notice Retrieve the description for a action.
     * @param _action The identifier for the action.
     * @return The action description.
     */
    function actionDescription(uint256 _action)
        public
        view
        returns(string memory)
    {
        require(_action < actions.length, "Event action not recognized.");
        return actions[_action];
    }

    /**
     * @notice Return the number of actions created.
     * @dev The zero position of the actions array is reserved for NO_ACTION and doesn't count
     * towards the total of actions.
     * @return The number of actions created.
     */
    function totalActions()
        public
        view
        returns(uint256)
    {
        return actions.length - 1;
    }

    /**
     * @notice Return the number of steps created.
     * @dev The zero position of the actions array is not used for valid steps and doesn't count
     * towards their total.
     * @return The number of steps created.
     */
    function totalSteps()
        public
        view
        returns(uint256)
    {
        return steps.length - 1;
    }

    /**
     * @notice Verify whether a step is the last of an item.
     * @param _step The step id of the step to verify.
     * @return Whether a step is the last of an item.
     */
    function isLastStep(uint256 _step)
        public
        view
        returns(bool)
    {
        if (_step > totalSteps()) return false;
        return lastSteps[steps[_step].item] == _step;
    }

    /**
     * @notice Retrieve the immediate precedents of a step.
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

    /**
     * @notice Retrieve the composite item this step refers to.
     * @param _step The step id of the step to start looking from.
     * @return The composite item this step refers to.
     */
    function getComposite(uint256 _step)
        public
        view
        returns(uint256)
    {
        uint256 step = _step;
        while (steps[step].partOf != NO_ITEM){
            step = lastSteps[steps[step].partOf];
        }
        return steps[step].item;
    }

    /**
     * @notice Retrieve the authorized operator role for a step, taking into account composition.
     * @param _step The step id of the step to retrieve operatorRole for.
     * @return The authorized operatorRole for this step.
     */
    function getoperatorRole(uint256 _step)
        public
        view
        returns(uint256)
    {
        return steps[lastSteps[getComposite(_step)]].operatorRole;
    }

    /**
     * @notice Retrieve the authorized owner role for a step, taking into account composition.
     * @param _step The step id of the step to retrieve ownerRole for.
     * @return The authorized ownerRole for this step.
     */
    function getownerRole(uint256 _step)
        public
        view
        returns(uint256)
    {
        return steps[lastSteps[getComposite(_step)]].ownerRole;
    }

    /** 
     * @notice Create a new step with no checks.
     */
    function pushStep
    (
        address _creator,
        uint256 _action,
        uint256 _item,
        uint256[] memory _precedents,
        uint256 _partOf,
        uint256 _operatorRole,
        uint256 _ownerRole
    )
        internal
    {
        uint256 stepId = steps.push(
            Step(
                _creator,
                _action,
                _item,
                _precedents,
                _partOf,
                _operatorRole,
                _ownerRole
            )
        ) - 1;
        lastSteps[_item] = stepId;
        emit StepCreated(stepId);        
    }

    /**
     * @notice Create a new supply chain step with no changes on ownership or item.
     * @param _action The index for the step action as defined in the actions array.
     * @param _item The item id that this step is for. This must be either the item 
     * of one of the steps in _precedents, or an item that has never been used before. 
     * @param _precedents An array of the step ids for steps considered to be predecessors to
     * this one. Often this would just mean that the event refers to the same asset as the event
     * pointed to, but for steps like Creation it could point to the parts this asset is made of.
     */
    function addInfoStep
    (
        uint256 _action, 
        uint256 _item, 
        uint256[] memory _precedents
    )
        public
    {
        require(_precedents.length > 0, "No precedents, use addRootStep.");

        require(_action < actions.length, "Event action not recognized.");
        
        for (uint i = 0; i < _precedents.length; i++){
            require(isLastStep(_precedents[i]), "Append only on last steps.");
        }

        // Check the item id is consistent
        bool repeatItem = false;
        for (uint i = 0; i < _precedents.length; i++){
            if (steps[_precedents[i]].item == _item) {
                repeatItem = true;
                break;
            }
        }
        require (repeatItem, "Item not valid.");

        // Check user belongs to the operatorRole of all precedents.
        for (uint i = 0; i < _precedents.length; i++){
            require(hasRole(msg.sender, getoperatorRole(_precedents[i])), "Not an operator of precedents.");
        }
        
        pushStep(
            msg.sender,
            _action,
            _item,
            _precedents,
            NO_PARTOF,
            getoperatorRole(_precedents[0]),
            getownerRole(_precedents[0])
        );
    }

    /**
     * @notice Create a new supply chain step without precedents.
     * @param _action The index for the step action as defined in the actions array.
     * @param _item The item id that this step is for. This must be an item that has never been
     * used before.
     * @param _operatorRole The roles allowed to append steps to this one.
     * @param _ownerRole The roles allowed to append steps with different permissions.
     */
    function addRootStep
    (
        uint256 _action, 
        uint256 _item, 
        uint256 _operatorRole,
        uint256 _ownerRole
    )
        public
    {

        require(_action < actions.length, "Event action not recognized.");

        require(_operatorRole != NO_ROLE, "An operator role is required.");

        require(_ownerRole != NO_ROLE, "An owner role is required.");
        
        require(lastSteps[_item] == 0, "Item not valid.");
        totalItems += 1;

        require(hasRole(msg.sender, _ownerRole), "Creator not in ownerRole.");
        
        uint256[] memory emptyArray;
        pushStep(
            msg.sender,
            _action,
            _item,
            emptyArray,
            NO_PARTOF,
            _operatorRole,
            _ownerRole
        );
    }

    /**
     * @notice Create a new supply chain step implying a transformation and a new item.
     * @param _action The index for the step action as defined in the actions array.
     * @param _item The new item id which must not have been used before. 
     * @param _precedents An array of the step ids for steps considered to be predecessors to
     * this one. Permissions are inherited from the first one.
     */
    function addTransformStep
    (
        uint256 _action, 
        uint256 _item, 
        uint256[] memory _precedents
    )
        public
    {
        require(_precedents.length > 0, "No precedents, use addRootStep.");

        require(_action < actions.length, "Event action not recognized.");

        require(lastSteps[_item] == 0, "Item not valid.");

        for (uint i = 0; i < _precedents.length; i++){
            require(isLastStep(_precedents[i]), "Append only on last steps.");
        }

        // Check user belongs to the operatorRole of all precedents.
        for (uint i = 0; i < _precedents.length; i++){
            require(hasRole(msg.sender, getoperatorRole(_precedents[i])), "Not an operator of precedents.");
        }
        
        totalItems += 1;
        pushStep(
            msg.sender,
            _action,
            _item,
            _precedents,
            NO_PARTOF,
            getoperatorRole(_precedents[0]),
            getownerRole(_precedents[0])
        );
    }

    /**
     * @notice Create a new supply chain step representing the handover of an item.
     * In practical terms it is a change in the permissions.
     * @param _action The index for the step action as defined in the actions array.
     * @param _item The item being handed over.
     * @param _operatorRole The roles allowed to append steps to this one.
     * @param _ownerRole The roles allowed to append steps with different permissions.
     */
    function addHandoverStep
    (
        uint256 _action, 
        uint256 _item,
        uint256 _operatorRole,
        uint256 _ownerRole
    )
        public
    {
        require(_action < actions.length, "Event action not recognized.");
        
        require(lastSteps[_item] != 0, "Item does not exist.");

        require(hasRole(msg.sender, getownerRole(lastSteps[_item])), "Needs owner for handover.");

        pushStep(
            msg.sender,
            _action,
            _item,
            new uint256[](lastSteps[_item]),
            NO_PARTOF,
            _operatorRole,
            _ownerRole
        );
    }

    /**
     * @notice Create a new supply chain step representing that the item in the step
     * passed as a parameter has become a part of another item.
     * @param _action The index for the step action as defined in the actions array.
     * @param _precedent The last step id for the item being made a part of another.
     * @param _partOf The item id for the item that this one is being made a part of.
     * TODO: Make this method internal. If called directly there is no guarantee that
     * steps[_precedent] is in the same chain as _partOf.
     */
    function addPartOfStep
    (
        uint256 _action,
        uint256 _precedent,
        uint256 _partOf
    )
        public
    {

        require(_action < actions.length, "Event action not recognized.");
        
        require(isLastStep(_precedent), "Append only on last steps.");

        require(lastSteps[_partOf] != 0, "Composite item does not exist.");

        require(hasRole(msg.sender, getownerRole(_precedent)), "Needs owner for partOf.");

        pushStep(
            msg.sender,
            _action,
            steps[_precedent].item,
            new uint256[](_precedent),
            _partOf,
            NO_ROLE,
            NO_ROLE
        );
    }

    /**
     * @notice Create new supply chain step implying a composition of a new item from others.
     * This method creates in a transaction one partOfStep for each precedent, and one 
     * TransformStep per call.
     * @param _action The index for the step action as defined in the actions array.
     * @param _item The new item id which must not have been used before. 
     * @param _precedents An array of the step ids for steps considered to be predecessors to
     * this one. Permissions are inherited from the first one.
     */
    function addComposeStep
    (
        uint256 _action, 
        uint256 _item, 
        uint256[] memory _precedents
    )
    public
    {
        addTransformStep(_action, _item, _precedents);
        for (uint256 i = 0; i < _precedents.length; i++){
            addPartOfStep(_action, _precedents[i], _item);
        }
    }
}
