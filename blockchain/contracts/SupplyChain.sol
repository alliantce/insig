pragma solidity ^0.5.0;

import "./RBAC.sol";


/**
 * @title Supply Chain
 * @author Alberto Cuesta Canada
 * @notice Implements a basic compositional supply chain contract.
 */
contract SupplyChain is RBAC {

    uint256 constant public NO_ACTION = 0;
    uint256 constant public NO_ITEM = 0;
    uint256 constant public NO_PARTOF = NO_ITEM;
    uint256 constant public NO_STEP = 0;

    event ActionCreated(uint256 action);
    event StateCreated(uint256 state);
    event AssetCreated(uint256 asset);

    /**
     * @notice Supply chain state data. By chaining these and not allowing them to be modified
     * afterwards we create an Acyclic Directed Graph.
     * @dev The state id is not stored in the State itself because it is always previously available
     * to whoever looks for the state. The types of the struct members have been chosen for optimal
     * struct packing.
     * @param creator The creator of this state.
     * @param action The action of this state.
     * @param asset The id of the object that this state refers to.
     * @param precedents The ids of the states that precede this one in the supply chain.
     * @param partOf The id of some other asset that this is part of and inherits permissions from.
     * @param operatorRole The roles allowed to append states to this one.
     * @param ownerRole The roles allowed to append states with different permissions.
     */
    struct State {
        address creator;
        uint256 action;
        uint256 asset;
        uint256[] precedents;
        uint256 partOf;
        uint256 operatorRole;
        uint256 ownerRole;
    }

    /**
     * @notice All states are directly accessible through a mapping keyed by the state ids. Recursive
     * structs are not supported in solidity yet.
     */
    State[] public states;

    /**
     * @notice The state actions, defined by their index in an array of their descriptions. Examples
     * could be Creation, Certification, Handover, Split, Merge, Destruction
     */
    string[] internal actions;

    /**
     * @notice Asset counter
     */
    uint256 public totalAssets;

    /**
     * @notice Mapping from asset id to the last state in the lifecycle of that asset.
     */
    mapping(uint256 => uint256) public lastStates;

    /**
     * @notice The contract constructor, empty as of now.
     */
    constructor() public {
        addAction("NO ACTION");
        uint256[] memory emptyArray;
        states.push(
            // solium-disable-next-line arg-overflow
            State(address(0), 0, 0, emptyArray, 0, 0, 0)
        );
        totalAssets = 0;
    }

    /**
     * @notice Create a new state action.
     * @param _actionDescription The description of the action being created.
     * @dev Product lines can be implemented with a state action that indicates the creation of a
     * product line that is a parent to all assets of that product. The creation of an asset
     * would also be its own state action, which would usually have as precedents a product line state
     * and other asset states for parts and materials. If implementing product lines as a state
     * action the asset id could be thought of as the product id and retrieved from lastStates
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
     * @notice Return the number of states created.
     * @dev The zero position of the actions array is not used for valid states and doesn't count
     * towards their total.
     * @return The number of states created.
     */
    function totalStates()
        public
        view
        returns(uint256)
    {
        return states.length - 1;
    }

    /**
     * @notice Returns whether an asset exists.
     * @param _asset The id for the asset.
     * @return Whether an asset exists.
     */
    function isAsset(uint256 _asset)
        public
        view
        returns(bool)
    {
        return lastStates[_asset] != 0;
    }

    /**
     * @notice Retrieve the immediate precedents of a state.
     * @param _state The state id of the state to retrieve precedents for.
     * @return An array with the state ids of the immediate precedents of the state given as a parameter.
     */
    function getPrecedents(uint256 _state)
        public
        view
        returns(uint256[] memory)
    {
        return states[_state].precedents;
    }

    /**
     * @notice Retrieve the direct composite asset of another one, if existing.
     * @param _asset The asset id verify if it's part of another one.
     * @return The direct composite asset.
     */
    function getPartOf(uint256 _asset)
        public
        view
        returns(uint256)
    {
        return states[lastStates[_asset]].partOf;
    }

    /**
     * @notice Retrieve the ultimate composite asset of another one, if existing.
     * @param _asset The asset id to start looking from.
     * @return The ultimate composite asset.
     */
    function getComposite(uint256 _asset)
        public
        view
        returns(uint256)
    {
        uint256 asset = _asset;
        State memory state = states[lastStates[asset]];
        while (state.partOf != NO_ITEM) {
            asset = state.partOf;
            state = states[lastStates[asset]];
        }
        return asset;
    }

    /**
     * @notice Explore the state tree backwards, to a depth of one asset transformation in each
     * branch, to count all the assets that contributed directly to this one.
     * @dev The whole purpose of this function is to allow getParts to instantiate an array of the
     * required length to return the asset ids, since dynamic arrays are not supported in memory.
     * @param _asset The asset id to count parts for.
     * @return The direct composite asset.
     */
    function countParts(uint256 _asset)
        public
        view
        returns(uint256)
    {
        // For all precedents to an asset, only one of them can share the same asset id
        // If a precedent shares the same asset id, store the state id and continue with it after exploring precedents with different ids
        // For each precedent with a different asset id which is part of this asset, add 1 to the counter.
        uint256 count = 0;
        uint256 nextStateId = lastStates[_asset];
        while (nextStateId != NO_STEP) {
            State memory state = states[nextStateId];
            nextStateId = NO_STEP;
            for (uint256 i = 0; i < state.precedents.length; i += 1) {
                uint256 precedentStateId = state.precedents[i];
                if (states[precedentStateId].asset != _asset &&
                    getPartOf(states[precedentStateId].asset) == _asset) {
                    count += 1;
                } else { // Only one of this can exist, store it to continue at the end of precedents.
                    nextStateId = precedentStateId;
                }
            }
        }

        return count;
    }

    /**
     * @notice Explore the state tree backwards, to a depth of one asset transformation in each
     * branch, to find all the assets that contributed directly to this one.
     * @param _asset The asset id to find parts for.
     * @return The direct composite asset.
     */
    function getParts(uint256 _asset)
        public
        view
        returns(uint256[] memory)
    {
        uint256[] memory parts = new uint256[](countParts(_asset));
        uint256 count = 0;
        uint256 nextStateId = lastStates[_asset];
        while (nextStateId != NO_STEP) {
            State memory state = states[nextStateId];
            nextStateId = NO_STEP;
            for (uint256 i = 0; i < state.precedents.length; i += 1) {
                uint256 precedentStateId = state.precedents[i];
                if (states[precedentStateId].asset != _asset &&
                    getPartOf(states[precedentStateId].asset) == _asset) {
                    parts[count] = states[precedentStateId].asset;
                    count += 1;
                } else { // Only one of this can exist, store it to continue at the end of precedents.
                    nextStateId = precedentStateId;
                }
            }
        }
        return parts;
    }

    /**
     * @notice Retrieve the authorized operator role for an asset, taking into account composition.
     * @param _asset The asset id of the asset to retrieve operatorRole for.
     * @return The authorized operatorRole for this state.
     */
    function getOperatorRole(uint256 _asset)
        public
        view
        returns(uint256)
    {
        return states[lastStates[getComposite(_asset)]].operatorRole;
    }

    /**
     * @notice Retrieve the authorized owner role for an asset, taking into account composition.
     * @param _asset The asset id of the asset to retrieve ownerRole for.
     * @return The authorized ownerRole for this state.
     */
    function getOwnerRole(uint256 _asset)
        public
        view
        returns(uint256)
    {
        return states[lastStates[getComposite(_asset)]].ownerRole;
    }

    /**
     * @notice Check if an address can operate an asset in the supply chain
     * @param _address The address to check operator role for.
     * @param _asset The id of the asset to check
     */
    function isOperator(address _address, uint256 _asset)
        public
        view
        returns(bool)
    {
        return hasRole(_address, getOperatorRole(_asset));
    }

    /**
     * @notice Check if an address owns an asset in the supply chain
     * @param _address The address to check ownership for.
     * @param _asset The id of the asset to check
     */
    function isOwner(address _address, uint256 _asset)
        public
        view
        returns(bool)
    {
        return hasRole(_address, getOwnerRole(_asset));
    }

    /**
     * @notice Create a new state.
     * @param _action The action of this state.
     * @param _asset The id of the object that this state refers to.
     * @param _precedents The ids of the states that precede this one in the supply chain.
     * @param _partOf The id of some other asset that this is part of and inherits permissions from.
     * @param _operatorRole The roles allowed to append states to this one.
     * @param _ownerRole The roles allowed to append states with different permissions.
     */
    function pushState
    (
        uint256 _action,
        uint256 _asset,
        uint256[] memory _precedents,
        uint256 _partOf,
        uint256 _operatorRole,
        uint256 _ownerRole
    )
        public // TODO: Make internal and run tests through a mock.
    {
        require(_action < actions.length, "Event action not recognized.");

        uint256 stateId = states.push(
            State(
                msg.sender,
                _action,
                _asset,
                _precedents,
                _partOf,
                _operatorRole,
                _ownerRole
            )
        ) - 1;
        lastStates[_asset] = stateId;
        emit StateCreated(stateId);
    }

    /**
     * @notice Create a new supply chain state without precedents.
     * @param _action The index for the state action as defined in the actions array.
     * @param _operatorRole The roles allowed to append states to this one.
     * @param _ownerRole The roles allowed to append states with different permissions.
     */
    function addRootState
    (
        uint256 _action,
        uint256 _operatorRole,
        uint256 _ownerRole
    )
        public
    {
        require(_operatorRole != NO_ROLE, "An operator role is required.");

        require(_ownerRole != NO_ROLE, "An owner role is required.");

        require(hasRole(msg.sender, _ownerRole), "Creator not in ownerRole.");

        totalAssets += 1;
        emit AssetCreated(totalAssets);

        uint256[] memory emptyArray;
        pushState(
            _action,
            totalAssets,
            emptyArray,
            NO_PARTOF,
            _operatorRole,
            _ownerRole
        );
    }

    /**
     * @notice Create a new supply chain state with no changes on ownership or asset.
     * @param _action The index for the state action as defined in the actions array.
     * @param _asset The asset id that this state is for. The operatorRole and ownerRole are inherited
     * from its last state.
     * @param _precedentAssets An array of the asset ids for assets considered to be predecessors to
     * this one. The asset passed in the previous parameter is added on to these.
     */
    function addInfoState
    (
        uint256 _action,
        uint256 _asset,
        uint256[] memory _precedentAssets
    )
        public
    {
        // Check all precedents exist.
        for (uint i = 0; i < _precedentAssets.length; i++) {
            require(isAsset(_precedentAssets[i]), "Precedent asset does not exist.");
        }

        // TODO: Check for repeated precedents in the array.

        // Check the asset id is not in precedents
        bool repeatAsset = false;
        for (uint i = 0; i < _precedentAssets.length; i++) {
            if (_precedentAssets[i] == _asset) {
                repeatAsset = true;
                break;
            }
        }
        require (!repeatAsset, "Asset in precedents."); // TODO: Extract to a function and use in addPartOfState

        // Check user belongs to the operatorRole of asset and all precedents.
        require(isOperator(msg.sender, _asset), "Not an operator of precedents.");
        for (uint i = 0; i < _precedentAssets.length; i++) {
            require(isOperator(msg.sender, _precedentAssets[i]), "Not an operator of precedents.");
        }

        // Build precedents array out of states from lastStates[_precedents[i]]
        uint256[] memory precedents = new uint256[](_precedentAssets.length + 1);
        precedents[0] = lastStates[_asset];
        for (uint i = 0; i < _precedentAssets.length; i++) {
            precedents[i + 1] = lastStates[_precedentAssets[i]];
        }

        pushState(
            _action,
            _asset,
            precedents,
            NO_PARTOF,
            getOperatorRole(_asset),
            getOwnerRole(_asset)
        );
    }

    /**
     * @notice Create a new supply chain state representing the handover of an asset.
     * In practical terms it is a change in the permissions.
     * @param _action The index for the state action as defined in the actions array.
     * @param _asset The asset being handed over.
     * @param _operatorRole The roles allowed to append states to this one.
     * @param _ownerRole The roles allowed to append states with different permissions.
     */
    function addHandoverState
    (
        uint256 _action,
        uint256 _asset,
        uint256 _operatorRole,
        uint256 _ownerRole
    )
        public
    {
        require(isAsset(_asset), "Asset does not exist.");

        require(isOwner(msg.sender, _asset), "Needs owner for handover.");

        uint256[] memory precedents = new uint256[](1);
        precedents[0] = lastStates[_asset];

        pushState(
            _action,
            _asset,
            precedents,
            NO_PARTOF,
            _operatorRole,
            _ownerRole
        );
    }

    /**
     * @notice Create a new supply chain state representing that an asset has become a part of
     * another asset.
     * @param _action The index for the state action as defined in the actions array.
     * @param _asset The asset being made a part of another.
     * @param _partOf The asset id for the asset that this one is being made a part of.
     */
    function addPartOfState
    (
        uint256 _action,
        uint256 _asset,
        uint256 _partOf
    )
        public
    {
        require(isAsset(_asset), "Asset does not exist.");

        require(isOwner(msg.sender, _asset), "Needs owner for partOf.");

        require(isAsset(_partOf), "Composite asset does not exist.");

        // Require that a state for _asset is in of states[lastStates[_partOf]].precedents
        // TODO: Check for precedent assets, not precedent states
        bool isPrecedent = false;
        uint256[] memory partOfprecedents = states[lastStates[_partOf]].precedents;
        for (uint256 i = 0; i < partOfprecedents.length; i += 1) {
            if (states[partOfprecedents[i]].asset == _asset) {
                isPrecedent = true;
                break;
            }
        }
        require(isPrecedent, "Asset not precedent of partOf.");

        uint256[] memory precedents = new uint256[](1);
        precedents[0] = lastStates[_asset];

        pushState(
            _action,
            _asset,
            precedents,
            _partOf,
            NO_ROLE,
            NO_ROLE
        );
    }

    // TODO: Consider a new supply chain state implying a composition of a new asset from others,
    // creating an Info and a PartOf states so that the composition is transactional.

}
