pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "./SupplyChain.sol";

/**
 * @title Token
 * @author Alberto Cuesta Canada
 * @notice Implements a token representation of supply chain items
 */
contract Token is ERC721 {

    address internal supplyChain;

    /**
     * @notice The constructor links the Token contract to the Supply Chain contract.
     * @param _supplychain The address of the SupplyChain.sol contract.
     */
    constructor(address _supplychain) public {
        supplyChain = _supplychain;
    }

    /**
     * @notice Function to mint tokens.
     * @param _to The address that will receive the minted tokens.
     * @param _tokenId The id of the token to mint.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address _to, uint256 _tokenId)
        public
        returns(bool)
    {
        SupplyChain _supplychain = SupplyChain(supplyChain);
        require(
            _supplychain.isOwner(msg.sender, _tokenId),
            "Minter not in ownerRole."
        );
        // To mint a token its underlying item cannot be part of another item without an instantiated token.
        // This means that to instantiate a part of a composite item several calls will be required to instantiate the path to the part.
        require(
            _exists(_supplychain.getPartOf(_tokenId)),
            "Instantiate composite first."
        );
        // To mint a token its underlying item cannot be part of another item owned by a different role.
        // This means that a token should be instantiated before its handed over to another party.
        require(
            msg.sender == ownerOf(_supplychain.getPartOf(_tokenId)),
            "Not owner of composite."
        );
        _mint(_to, _tokenId);
        return true;
    }

    /**
     * @dev Function to burn tokens.
     * @param _tokenId The id of the token to burn.
     * @return A boolean that indicates if the operation was successful.
     */
    function burn(uint256 _tokenId)
        public
        returns(bool)
    {
        require(
            SupplyChain(supplyChain).isOwner(msg.sender, _tokenId),
            "Burner not in ownerRole."
        );
        // To burn a token its underlying item cannot have parts with instantiated tokens.
        // This means that to burn a token all the tokens for its parts need to be burnt first.
        uint256[] memory parts = SupplyChain(supplyChain).getParts(_tokenId);
        for (uint256 i = 0; i < parts.length; i += 1){
            require(!_exists(parts[i]), "Burn part tokens first.");
        }
        _burn(_tokenId);
        return true;
    }
}
