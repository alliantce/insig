pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./SupplyChain.sol";


/**
 * @title Token
 * @author Alberto Cuesta Canada
 * @notice Implements a token representation of supply chain assets
 */
contract Token is ERC721 {
    using SafeMath for uint256;

    event RevenueUpdated(uint256 tokenId, uint256 amount);
    // event Amount(uint256 tokenId, uint256 amount);
    // event FaceValue(uint256 tokenId, uint256 facevalue);
    // event Parts(uint256 tokenId, uint256 parts);

    address internal supplyChain;

    // Mapping of token to face value
    mapping (uint256 => uint256) public faceValue;

    // Mapping of token to accumulated revenues.
    mapping(uint256 => uint256) public revenues;

    /**
     * @notice The constructor links the Token contract to the Supply Chain contract.
     * @param _supplychain The address of the SupplyChain.sol contract.
     */
    constructor(address _supplychain) public {
        supplyChain = _supplychain;
    }

    /**
     * @notice Returns whether the specified token exists
     * @dev Only implemented so that it can be called from the client.
     * @param _tokenId uint256 ID of the token to query the existence of
     * @return bool whether the token exists
     */
    function exists(uint256 _tokenId)
        public
        view
        returns (bool)
    {
        return _exists(_tokenId);
    }

    /**
     * @notice Mint tokens.
     * @param _to The address that will receive the minted tokens.
     * @param _tokenId The id of the token to mint.
     * @param _faceValue The face value of the token.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(address _to, uint256 _tokenId, uint256 _faceValue)
        public
        returns(bool)
    {
        require(!exists(_tokenId), "Token already exists.");

        SupplyChain _supplychain = SupplyChain(supplyChain);
        require(
            _supplychain.isOwner(msg.sender, _tokenId),
            "Minter not in ownerRole."
        );
        // To mint a token its underlying asset cannot be part of another asset without an instantiated token.
        // This means that to instantiate a part of a composite asset several calls will be required to instantiate the path to the part.
        uint256 partOf = _supplychain.getPartOf(_tokenId);
        require(
            partOf == _supplychain.NO_PARTOF() ||
                exists(_supplychain.getPartOf(_tokenId)),
            "Instantiate composite first."
        );
        // To mint a token its underlying asset cannot be part of another asset with a token owned by a different role.
        // This means that a token should be instantiated before its handed over to another party.
        require(
            _supplychain.getPartOf(_tokenId) == _supplychain.NO_PARTOF() ||
                msg.sender == ownerOf(_supplychain.getPartOf(_tokenId)),
            "Not owner of composite token."
        );

        // TODO: Consider using a tree of asset compositions as an index to avoid frequent calls to getParts()
        // Require that the face value of composite is higher or equal than all the parts combined
        if (partOf != _supplychain.NO_PARTOF()) {
            uint256 combinedFaceValue = _faceValue;
            uint256[] memory parts = _supplychain.getParts(partOf);
            for (uint256 i = 0; i < parts.length; i += 1) {
                combinedFaceValue = combinedFaceValue.add(faceValue[parts[i]]);
            }
            require(
                combinedFaceValue <= faceValue[partOf],
                "Face value exceeds available."
            );
        }

        _mint(_to, _tokenId);
        faceValue[_tokenId] = _faceValue;
        return true;
    }

    /**
     * @notice Burn tokens.
     * @param _tokenId The id of the token to burn.
     * @return A boolean that indicates if the operation was successful.
     */
    function burn(uint256 _tokenId)
        public
        returns(bool)
    {
        require(exists(_tokenId), "Token doesn't exist.");

        require(
            SupplyChain(supplyChain).isOwner(msg.sender, _tokenId),
            "Burner not in ownerRole."
        );
        // To burn a token its underlying asset cannot have parts with instantiated tokens.
        // This means that to burn a token all the tokens for its parts need to be burnt first.
        uint256[] memory parts = SupplyChain(supplyChain).getParts(_tokenId);
        for (uint256 i = 0; i < parts.length; i += 1) {
            require(!exists(parts[i]), "Burn part tokens first.");
        }
        _burn(_tokenId);
        delete faceValue[_tokenId];
        return true;
    }

    /**
     * @notice Pay an amount to a token and distribute it if it has parts with instantiated tokens.
     * @param _tokenId The id of the token to pay to.
     * @param _amount The amount of the utility token to pay with.
     */
    function pay(
        uint256 _tokenId,
        uint256 _amount
    )
        public
    {
        require(exists(_tokenId), "Token doesn't exist.");

        // emit Amount(_tokenId, _amount);
        // emit Parts(_tokenId, SupplyChain(supplyChain).getParts(_tokenId).length);

        uint256 faceValueParts = 0;
        uint256 faceValueComposite = faceValue[_tokenId];
        uint256[] memory parts = SupplyChain(supplyChain).getParts(_tokenId);
        for (uint256 i = 0; i < parts.length; i += 1) {
            uint256 payment = _amount.mul(faceValue[parts[i]]).div(faceValueComposite);
            pay(parts[i], payment);
            faceValueParts = faceValueParts.add(faceValue[parts[i]]);
        }
        revenues[_tokenId] = revenues[_tokenId].add(
            _amount.mul(faceValueComposite.sub(faceValueParts)).div(faceValueComposite)
        );
        emit RevenueUpdated(_tokenId, revenues[_tokenId]);
    }

    /**
     * @notice Withdraw accumulated revenues for a token.
     * @param _tokenId The id of the token to withdraw from.
     */
    function withdraw(
        uint256 _tokenId
    )
        public
    {
        require(exists(_tokenId), "Token doesn't exist.");

        require(
            SupplyChain(supplyChain).isOwner(msg.sender, _tokenId),
            "Only owner can withdraw."
        );
        // ERC20(UtilityTokenContract).transfer(msg.sender, revenues[_tokenId]);
        delete revenues[_tokenId];
        emit RevenueUpdated(_tokenId, 0);
    }
    // TODO: Test fails with no tokens.
    // TODO: Test fails for non owner.
    // TODO: Sanity check.

}
