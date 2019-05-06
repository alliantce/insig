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
     * @notice Explore the step tree backwards, to a depth of one item transformation in each
     * branch, to find all the items that contributed directly to this one.
     * @param _item The item id to find parts for.
     * @return The direct composite item.
     */
    function getParts(uint256 _item)
        public
        view
        returns(uint256[] memory)
    {
        uint256[] memory parts = new uint256[](countParts(_item));
        uint256 count = 0;
        uint256 nextStepId = lastSteps[_item];
        while (nextStepId != NO_STEP){
            Step memory step = steps[nextStepId];
            nextStepId = NO_STEP;
            for(uint256 i = 0; i < step.precedents.length; i += 1){
                uint256 precedentStepId = step.precedents[i];
                if (steps[precedentStepId].item != _item){
                    parts[count] = steps[precedentStepId].item;
                    count += 1;
                }
                else{ // Only one of this can exist, store it to continue at the end of precedents.
                    nextStepId = precedentStepId;
                }
            }
        }
        return parts;
    }

    /**
     * @notice Explore the step tree backwards, to a depth of one item transformation in each
     * branch, to count all the items that contributed directly to this one.
     * @dev The whole purpose of this function is to allow getParts to instantiate an array of the
     * required length to return the item ids, since dynamic arrays are not supported in memory.
     * @param _item The item id to count parts for.
     * @return The direct composite item.
     */
    function countParts(uint256 _item)
        public
        view
        returns(uint256)
    {
        // For all precedents to an item, only one of them can share the same item id
        // If a precedent shares the same item id, store the step id and continue with it after exploring precedents with different ids
        // For each precedent with a different item id, add 1 to the counter.
        uint256 count = 0;
        uint256 nextStepId = lastSteps[_item];
        while (nextStepId != NO_STEP){
            Step memory step = steps[nextStepId];
            nextStepId = NO_STEP;
            for(uint256 i = 0; i < step.precedents.length; i += 1){
                uint256 precedentStepId = step.precedents[i];
                if (steps[precedentStepId].item != _item){
                    count += 1;
                }
                else{ // Only one of this can exist, store it to continue at the end of precedents.
                    nextStepId = precedentStepId;
                }
            }
        }

        return count;
    }

    /**
     * @notice Retrieve the direct composite item of another one, if existing.
     * @param _item The item id verify if it's part of another one.
     * @return The direct composite item.
     */
    function getPartOf(uint256 _item)
        public
        view
        returns(uint256)
    {
        return steps[lastSteps[_item]].partOf;
    }

    /**
     * @notice Retrieve the ultimate composite item of another one, if existing.
     * @param _item The item id to start looking from.
     * @return The ultimate composite item.
     */
    function getComposite(uint256 _item)
        public
        view
        returns(uint256)
    {
        uint256 item = _item;
        Step memory step = steps[lastSteps[item]];
        while (step.partOf != NO_ITEM){
            item = step.partOf;
            step = steps[lastSteps[item]];
        }
        return item;
    }

    /**
     * @notice Retrieve the authorized operator role for an item, taking into account composition.
     * @param _item The item id of the item to retrieve operatorRole for.
     * @return The authorized operatorRole for this step.
     */
    function getOperatorRole(uint256 _item)
        public
        view
        returns(uint256)
    {
        return steps[lastSteps[getComposite(_item)]].operatorRole;
    }

    /**
     * @notice Retrieve the authorized owner role for an item, taking into account composition.
     * @param _item The item id of the item to retrieve ownerRole for.
     * @return The authorized ownerRole for this step.
     */
    function getOwnerRole(uint256 _item)
        public
        view
        returns(uint256)
    {
        return steps[lastSteps[getComposite(_item)]].ownerRole;
    }

    /**
     * @notice Check if an address can operate an item in the supply chain
     * @param _address The address to check operator role for.
     * @param _item The id of the item to check
     */
    function isOperator(address _address, uint256 _item)
        public
        view
        returns(bool)
    {
        return hasRole(_address, getOperatorRole(_item));
    }

    /**
     * @notice Check if an address owns an item in the supply chain
     * @param _address The address to check ownership for.
     * @param _item The id of the item to check
     */
    function isOwner(address _address, uint256 _item)
        public
        view
        returns(bool)
    {
        return hasRole(_address, getOwnerRole(_item));
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
        // TODO: Should I at least assert that everything exists?

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
     * @param _precedentItems An array of the item ids for items considered to be predecessors to
     * this one. The operatorRole and ownerRole are inherited from the first item in this array.
     */
    function addInfoStep
    (
        uint256 _action,
        uint256 _item,
        uint256[] memory _precedentItems
    )
        public
    {
        require(_precedentItems.length > 0, "No precedents, use addRootStep.");

        require(_action < actions.length, "Event action not recognized.");
        
        // Check all precedents exist.
        for (uint i = 0; i < _precedentItems.length; i++){
            require(lastSteps[_precedentItems[i]] != 0, "Precedent item does not exist.");
        }

        // Check the item id is in precedents
        bool repeatItem = false;
        for (uint i = 0; i < _precedentItems.length; i++){
            if (_precedentItems[i] == _item) {
                repeatItem = true;
                break;
            }
        }
        require (repeatItem, "Item not in precedents.");

        // Check user belongs to the operatorRole of all precedents.
        for (uint i = 0; i < _precedentItems.length; i++){
            require(isOperator(msg.sender, _precedentItems[i]), "Not an operator of precedents.");
        }

        // Build precedents array out of steps from lastSteps[_precedents[i]]
        uint256[] memory precedents = new uint256[](_precedentItems.length);
        for (uint i = 0; i < _precedentItems.length; i++){
            precedents[i] = lastSteps[_precedentItems[i]];
        }

        pushStep(
            msg.sender,
            _action,
            _item,
            precedents,
            NO_PARTOF,
            getOperatorRole(_precedentItems[0]),
            getOwnerRole(_precedentItems[0])
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

        require(lastSteps[_item] == 0, "New item already exists.");
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
     * @param _precedentItems An array of the item ids for items considered to be predecessors to
     * this one. Permissions are inherited from the first one.
     */
    function addTransformStep
    (
        uint256 _action,
        uint256 _item,
        uint256[] memory _precedentItems
    )
        public
    {
        require(_precedentItems.length > 0, "No precedents, use addRootStep.");

        require(_action < actions.length, "Event action not recognized.");

        require(lastSteps[_item] == 0, "New item already exists.");

        // Check all precedents exist.
        for (uint i = 0; i < _precedentItems.length; i++){
            require(lastSteps[_precedentItems[i]] != 0, "Precedent item does not exist.");
        }

        // Check user belongs to the operatorRole of all precedents.
        for (uint i = 0; i < _precedentItems.length; i++){
            require(isOperator(msg.sender, _precedentItems[i]), "Not an operator of precedents.");
        }

        // Build precedents array out of steps from lastSteps[_precedents[i]]
        uint256[] memory precedents = new uint256[](_precedentItems.length);
        for (uint i = 0; i < _precedentItems.length; i++){
            precedents[i] = lastSteps[_precedentItems[i]];
        }

        totalItems += 1;
        pushStep(
            msg.sender,
            _action,
            _item,
            precedents,
            NO_PARTOF,
            getOperatorRole(_precedentItems[0]),
            getOwnerRole(_precedentItems[0])
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

        require(isOwner(msg.sender, _item), "Needs owner for handover.");

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
     * @notice Create a new supply chain step representing that an item has become a part of
     * another item.
     * @param _action The index for the step action as defined in the actions array.
     * @param _item The item being made a part of another.
     * @param _partOf The item id for the item that this one is being made a part of.
     * TODO: Make this method internal. If called directly there is no guarantee that
     * steps[_precedent] is in the same chain as _partOf.
     */
    function addPartOfStep
    (
        uint256 _action,
        uint256 _item,
        uint256 _partOf
    )
        public
    {

        require(_action < actions.length, "Event action not recognized.");

        require(lastSteps[_item] != 0, "Item does not exist.");

        require(lastSteps[_partOf] != 0, "Composite item does not exist.");

        require(isOwner(msg.sender, _item), "Needs owner for partOf.");

        pushStep(
            msg.sender,
            _action,
            _item,
            new uint256[](lastSteps[_item]),
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
