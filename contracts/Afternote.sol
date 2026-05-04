// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

import {FHE, euint128, InEuint128} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract Afternote {
    uint64 constant RELEASE_DELAY = 10 days; //7 DAYS DUE + 3 DAYS GRACE
    uint8 constant MAX_BENEFICIARIES = 3;

    struct Vault {
        euint128 encryptedKey;
        euint128 encryptedIv;
        bytes ciphertext;
        address[] beneficiaries;
        uint64 lastActiveAt;
        bool isReleased;
    }

    mapping(address => Vault[]) public vaults;

    event VaultAdded(
        uint256 indexed idx,
        address indexed owner,
        bytes32 indexed encryptedKeyHandle,
        bytes32 encryptedIvHandle,
        bytes ciphertext,
        address[] beneficiaries
    );

    event VaultUpdated(
        uint256 indexed idx,
        address indexed owner,
        bytes32 indexed encryptedKeyHandle,
        bytes32 encryptedIvHandle,
        bytes ciphertext,
        address[] beneficiaries
    );

    event VaultPinged(uint256 indexed idx, address indexed owner);

    event VaultReleased(
        uint256 indexed idx,
        address indexed owner,
        address indexed caller,
        address[] beneficiaries
    );

    function addVault(
        InEuint128 calldata _encryptedKeyValue,
        InEuint128 calldata _encryptedIvValue,
        bytes calldata _ciphertext,
        address[] calldata _beneficiaries
    ) external {
        require(
            _beneficiaries.length <= MAX_BENEFICIARIES,
            "Beneficiaries limit exceeded"
        );
        uint256 vaultIndex = vaults[msg.sender].length;

        euint128 encryptedKey = FHE.asEuint128(_encryptedKeyValue);
        euint128 encryptedIv = FHE.asEuint128(_encryptedIvValue);
        FHE.allowThis(encryptedKey);
        FHE.allowSender(encryptedKey);
        FHE.allowThis(encryptedIv);
        FHE.allowSender(encryptedIv);

        vaults[msg.sender].push();
        Vault storage vault = vaults[msg.sender][vaultIndex];
        vault.encryptedKey = encryptedKey;
        vault.encryptedIv = encryptedIv;
        vault.ciphertext = _ciphertext;
        vault.beneficiaries = _beneficiaries;
        vault.lastActiveAt = uint64(block.timestamp);

        emit VaultAdded(
            vaultIndex,
            msg.sender,
            euint128.unwrap(encryptedKey),
            euint128.unwrap(encryptedIv),
            _ciphertext,
            _beneficiaries
        );
    }

    function updateVault(
        uint256 _vaultIndex,
        InEuint128 calldata _encryptedKeyValue,
        InEuint128 calldata _encryptedIvValue,
        bytes calldata _ciphertext,
        address[] calldata _beneficiaries
    ) external {
        require(
            _beneficiaries.length <= MAX_BENEFICIARIES,
            "Beneficiaries limit exceeded"
        );
        require(_vaultIndex < vaults[msg.sender].length, "Invalid vault index");

        Vault storage vault = vaults[msg.sender][_vaultIndex];
        require(!vault.isReleased, "Vault already released");

        euint128 encryptedKey = FHE.asEuint128(_encryptedKeyValue);
        euint128 encryptedIv = FHE.asEuint128(_encryptedIvValue);
        FHE.allowThis(encryptedKey);
        FHE.allowSender(encryptedKey);
        FHE.allowThis(encryptedIv);
        FHE.allowSender(encryptedIv);
        vault.encryptedKey = encryptedKey;
        vault.encryptedIv = encryptedIv;
        vault.ciphertext = _ciphertext;
        vault.beneficiaries = _beneficiaries;
        vault.lastActiveAt = uint64(block.timestamp);

        emit VaultUpdated(
            _vaultIndex,
            msg.sender,
            euint128.unwrap(encryptedKey),
            euint128.unwrap(encryptedIv),
            _ciphertext,
            _beneficiaries
        );
    }

    function ping(uint256 _vaultIndex) external {
        require(_vaultIndex < vaults[msg.sender].length, "Invalid vault index");

        Vault storage vault = vaults[msg.sender][_vaultIndex];
        require(!vault.isReleased, "Vault already released");

        vault.lastActiveAt = uint64(block.timestamp);
        emit VaultPinged(_vaultIndex, msg.sender);
    }

    function release(uint256 _vaultIndex, address _owner) external {
        require(_vaultIndex < vaults[_owner].length, "Invalid vault index");

        Vault storage vault = vaults[_owner][_vaultIndex];
        require(!vault.isReleased, "Vault already released");
        require(vault.beneficiaries.length > 0, "No beneficiaries set");
        require(
            block.timestamp >= vault.lastActiveAt + RELEASE_DELAY,
            "Vault is still active"
        );
        vault.isReleased = true;
        address[] storage beneficiaries = vault.beneficiaries;
        uint256 beneficiariesLength = beneficiaries.length;
        euint128 encryptedKey = vault.encryptedKey;
        euint128 encryptedIv = vault.encryptedIv;

        for (uint256 i = 0; i < beneficiariesLength; i++) {
            FHE.allow(encryptedKey, beneficiaries[i]);
            FHE.allow(encryptedIv, beneficiaries[i]);
        }

        emit VaultReleased(_vaultIndex, _owner, msg.sender, beneficiaries);
    }

    // ---------------- VIEW ----------------

    function getVaultById(
        uint256 _vaultIndex
    ) external view returns (Vault memory) {
        require(_vaultIndex < vaults[msg.sender].length, "Invalid vault index");
        return vaults[msg.sender][_vaultIndex];
    }
}
