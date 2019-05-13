# Implementing a Supply Chain for Ethereum

_When consumers purchase a Toyota, they are not simply purchasing a car, truck or van. They are placing their trust in our company. - Akio Toyoda_

## Introduction

Supply Chain has always ranked up high as one of those use cases that should be disrupted by blockchain technology. The main reasons for that are supply chains are large, distributed networks of participants that don’t trust each other and where fraud is rife. There isn’t an industry player that can really claim to know with certainty the lifecycle of their products, cradle-to-cradle. It is really difficult to harmonize the data from all components of a supply chain, and the chances of catching someone providing false information are low.

In [TechHQ](https://www.techhq.io/) we have been involved in designing a number of Supply Chain solutions, and in this series of articles I will show a simple [implementation of a blockchain based supply chain database](https://github.com/HQ20/SupplyChain) where data can be trusted to be complete and correct.

## Conceptual Design

At the core of our solution is the data representation for the Supply Chain as a Directed Acyclic Graph. Many have proposed using an ERC721 token for this task, and at first sight it might look like a good idea. ERC721 tokens are uniquely identifiable and indivisible, so it is easy to think that a token can represent a part that changes hands through the supply chain.

However, the ERC721 token focuses very strongly in the handover part, and not so much in providing easy use of the history of the item represented. Another issue is that although ERC721 tokens are indivisible, Supply Chains often work with raw materials that are always divisible, as well as with batches of items that would be too cumbersome to track individually.

In this solution we are going to depart from the physical-item-as-token representation, and instead we are going to focus on the lifecycle of those physical items, including partitioning and composing them. Our base data element is going to be  a **State**, which will represent an event at a specific time for an item which is part of some supply chain. Some example states could be:

*   The production of an item.
*   The certification of an item by an expert.
*   The shipping of an item.
*   The production of a blueprint to produce items.
*   An update on a blueprint.
*   The transformation of a raw material into a different item.
*   The destruction or recycling of an item.

In a mature solution each state would record quite a few data points, but for this example we will focus on only three of them.

1. The unique state identifier, assigned sequentially.
2. The unique identifier of the item that the state refers to, chosen by the user.
3. The immediately precedent states to the one being created.

The item identifier refers to a physical item and it will change along in a state from its precedents if the item itself is substantially transformed. For example a batch of material could have the 0x100 identifier, and then from that batch we could produce 100 items with identifiers 0x100 to 0x199. All those produced items would each one have its own state in the Supply Chain, and all of them would point to the last known state of 0x100, the material used to produce them.

A state won’t always imply a new item identifier. In the previous example, imagine that there is plenty of material left from building all those parts, and that leftover material is sold to some other company. A new state would be created for 0x100 to represent this change of hands, which would point to the last known state for 0x100. Any new events related to an item must always point to its last known state.

The behaviour for composition is similar, if several items are combined, a state will be created that has an identifier different from all of them, and that has all of them as precedent states.

These simple rules create a Directed Acyclic Graph that can easily be traversed backwards to find the lifecycle of an item back to its raw materials. By keeping an index of the last states for all items that were ever created we can also traverse the graph forwards. With these two motions we have a complete view of the whole supply chain, starting from any item and finding all other related items along with all their history.

Before we get into the implementation, it is important to note why this is a blockchain application and how it is different from just recording all this data in a database. 

This solution doesn’t support altering or deleting events, it is an append-only database guaranteed by a distributed blockchain not to have been tampered with. All the information stored in this database is also signed, so that any malicious actor introducing false information needs to take into account that the false information will be there forever linked to his identifier. Finally, by the blockchain being distributed and resistant to failure, a few stakeholders losing interest in the platform doesn’t compromise its effectivity.

In short, this solution becomes an easy to use, trusted and robust system for the tracking of supply chains at a massive scale. And we can prototype it in about a hundred lines of code.

## Implementation

The data structures of SupplyChain.sol are limited to:

1. A vanilla contract.
2. A struct representing a State, which holds the item, precedents and state creator.
3. A counter for the total of states created.
4. A mapping for all the states created.
5. A mapping pointing to the last created states for each item.


```
pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
* @title Supply Chain
* @author Alberto Cuesta Canada
* @notice Implements a basic compositional supply chain contract.
*/
contract SupplyChain {
   using SafeMath for uint256;

   event StateCreated(uint256 state);

   /**
    * @notice Supply chain state data. By chaining these and not allowing them to be modified
    * afterwards we create an Acyclic Directed Graph.
    * @dev The state id is not stored in the State itself because it is always previously available
    * to whoever looks for the state. The types of the struct members have been chosen for optimal
    * struct packing.
    * @param creator The creator of this state.
    * @param item The id of the object that this state refers to.
    * @param precedents The ids of the states that precede this one in the supply chain.
    */
   struct State {
       address creator;
       uint256 item;
       uint256[] precedents;
   }

   /**
    * @notice All states are directly accessible through a mapping keyed by the state ids. 
    * Recursive structs are not supported in solidity yet.
    */
   mapping(uint256 => State) public states;

   /**
    * @notice State counter
    */
   uint256 public totalStates;

   /**
    * @notice Mapping from item id to the last state in the lifecycle of that item.
    */
   mapping(uint256 => uint256) public lastStates;
```


The methods of SupplyChain.sol are limited to:



1. A method to append new states that observes rules on items and precedents, and updates counters and indexes.
2. A helper method to find out whether a state can be appended to.
3. A helper method to unpack precedents from a state struct.


```
   /**
    * @notice A method to create a new supply chain state. The msg.sender is recorded as the 
    * creator of the state, which might possibly mean creator of the underlying asset as well.
    * @param _item The item id that this state is for. This must be either the item
    * of one of the states in _precedents, or an item that has never been used before.
    * @param _precedents An array of the state ids for states considered to be predecessors to
    * this one. Often this would just mean that the event refers to the same asset as the event
    * pointed to, but for states like Creation it could point to the parts this asset is made of.
    * @return The state id of the state created.
    */
   function addState(uint256 _item, uint256[] memory _precedents)
       public
       returns(uint256)
   {
       for (uint i = 0; i < _precedents.length; i++){
           require(isLastState(_precedents[i]), "Append only on last states.");
       }
       bool repeatInstance = false;
       for (uint i = 0; i < _precedents.length; i++){
           if (states[_precedents[i]].item == _item) {
               repeatInstance = true;
               break;
           }
       }
       if (!repeatInstance){
           require(lastStates[_item] == 0, "Instance not valid.");
       }


       states[totalStates] = State(
           msg.sender,
           _item,
           _precedents
       );
       uint256 state = totalStates;
       totalStates += 1;
       lastStates[_item] = state;
       emit StateCreated(state);
       return state;
   }

   /**
    * @notice A method to verify whether a state is the last of an item.
    * @param _state The state id of the state to verify.
    * @return Whether a state is the last of an item.
    */
   function isLastState(uint256 _state)
       public
       view
       returns(bool)
   {
       return lastStates[states[_state].item] == _state;
   }

   /**
    * @notice A method to retrieve the precedents of a state.
    * @param _state The state id of the state to retrieve precedents for.
    * @return An array with the state ids of the precedents of the state given as a parameter.
    */
   function getprecedents(uint256 _state)
       public
       view
       returns(uint256[] memory)
   {
       return states[_state].precedents;
   }
}
```


## Testing

Immutability in blockchain also means that your bugs will haunt you forever, that’s why I test my contracts exhaustively. For SupplyChain.sol I was happy with this set of 9 tests that ensure that a Directed Acyclic Graph is built and can be queried. You can peruse the HQ20 github repository for details on them.

```
 Contract: SupplyChain

    States

      ✓ addState creates a state. (90ms)

      ✓ addState creates chains. (160ms)

      ✓ addState maintains lastStates. (121ms)

      ✓ append only on last states (107ms)

      ✓ addState allows multiple precedents. (136ms)

      ✓ item must be unique or the same as a direct precedent. (114ms)

      ✓ addState records state creator. (128ms)

      ✓ addState records item. (165ms)

      ✓ lastStates records item. (138ms)

  9 passing (2s)
```

## Conclusion

In this article we have shown a simple yet powerful implementation of a supply chain for Ethereum. While a large proportion of previous implementations have been based in an ERC721 token, we have decided instead to implement a document registry structured as a Directed Acyclic Graph without any cryptocurrency capabilities.

Our chosen implementation allows to easily recover the lifecycle of any item in the supply chain to their inception. A frontend can be plugged in with more advanced query and filter capabilities.

The use cases that are served by our implementation include some of the thorniest issues in any supply chain, for example:



*   Locate which customers are affected by a defective production process so that a targeted recall can be issued.
*   Ensuring legitimacy across the supply chain with reliable certification processes.
*   Transparency on the supply chain to enable more efficient and controlled journeys.

Of course this is a very simplistic approach which only shows that a Directed Acyclic Graph can be easily built and that it can represent a Supply Chain in a useful way. A huge gap in this implementation is that anyone can append states in the lifecycle of any item, as long as they know the item identifier. In the next article of this series we will build Role Based Access Control capabilities, which will enable us to secure the data and accurately represent the handover of items in the Supply Chain.

