// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

contract Messager {
    string public textMessage = "Hello World!";
    address public messageSender = msg.sender;

    // EIP-712 domain parameters
    struct EIP712Domain {
        string name;
        string version;
        uint256 chainId;
        address verifyingContract;
    }

    struct Message {
        string text;
        uint256 deadline;
    }

    // EIP-712 domain separator
    bytes32 immutable DOMAIN_SEPARATOR;

    bytes32 immutable MESSAGE_TYPEHASH;
    bytes32 immutable DOMAIN_TYPEHASH;

    event MessageChanged(string text, address sender);

    constructor () {
        MESSAGE_TYPEHASH = keccak256("Message(string text,uint256 deadline)");
        
        DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
  
        DOMAIN_SEPARATOR = hashDomain(EIP712Domain({
            name: "Messager",
            version: "1",
            chainId: block.chainid,
            verifyingContract: address(this)
        }));
    }

    function hashDomain(EIP712Domain memory domain) internal view returns (bytes32) {
        return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(bytes(domain.name)),
            keccak256(bytes(domain.version)),
            domain.chainId,
            domain.verifyingContract
        ));
    }

    function hashText(Message memory textmessage) internal view returns (bytes32) {
        return keccak256(abi.encode(
            MESSAGE_TYPEHASH,
            keccak256(bytes(textmessage.text)),
            textmessage.deadline
        ));
    }

    // Verify that a message was signed by the owner of the given address
    function verify(Message memory textmessage, address sender, uint8 v, bytes32 r, bytes32 s) public view returns (bool) {
        // concatenate EIP712Domain separator and Message struct hash to create the digest
        bytes32 hash = keccak256(abi.encodePacked(
            "\x19\x01",
            DOMAIN_SEPARATOR,
            hashText(textmessage)
        ));

        // Recover the signer's address
        address recoveredAddress = ecrecover(hash, v, r, s);

        // use ecrecover to extract the address from the signature and compare it to the provided address
        return recoveredAddress == sender;
    }

    function message(Message memory textmessage, address sender, uint8 v, bytes32 r, bytes32 s) public {
        // verify the signature and that the deadline has not passed
        require(verify(textmessage, sender, v, r, s), "SIGNATURE DOES NOT MATCH");
        require(block.timestamp <= textmessage.deadline, "DEADLINE HAS BEEN REACHED");
        textMessage = textmessage.text;
        messageSender = sender;
        emit MessageChanged(textMessage, messageSender);
    }
}