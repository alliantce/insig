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
     * @notice 
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
        require(
            SupplyChain(supplyChain).isOwner(msg.sender, _tokenId), 
            "Minter not in ownerRole."
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
        _burn(_tokenId);
        return true;
    }
}
