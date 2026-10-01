// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

import {FHE, euint128, externalEuint128} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract Afternote {
    uint64 constant RELEASE_DELAY = 10 days; //7 DAYS DUE + 3 DAYS GRACE
    uint8 constant MAX_BENEFICIARIES = 3;

    struct Vault {
        euint128 encryptedKey;
        euint128 encryptedIv;
        bytes ciphertext;
        address[] beneficiaries;
        uint64 createdAt;
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
        externalEuint128 _encryptedKeyValue,
        externalEuint128 _encryptedIvValue,
        bytes calldata _signature,
        bytes calldata _ciphertext,
        address[] calldata _beneficiaries
    ) external {
        require(
            _beneficiaries.length <= MAX_BENEFICIARIES,
            "Beneficiaries limit exceeded"
        );
        uint256 vaultIndex = vaults[msg.sender].length;
        uint64 blockTimestamp = uint64(block.timestamp);

        (
            euint128 encryptedKey,
            euint128 encryptedIv
        ) = _prepareEncryptedKeyAndIv(
                _encryptedKeyValue,
                _encryptedIvValue,
                _signature
            );

        vaults[msg.sender].push(
            Vault({
                encryptedKey: encryptedKey,
                encryptedIv: encryptedIv,
                ciphertext: _ciphertext,
                beneficiaries: _beneficiaries,
                createdAt: blockTimestamp,
                lastActiveAt: blockTimestamp,
                isReleased: false
            })
        );

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
        externalEuint128 _encryptedKeyValue,
        externalEuint128 _encryptedIvValue,
        bytes calldata _signature,
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

        (
            euint128 encryptedKey,
            euint128 encryptedIv
        ) = _prepareEncryptedKeyAndIv(
                _encryptedKeyValue,
                _encryptedIvValue,
                _signature
            );

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

    function release(address _owner, uint256 _vaultIndex) external {
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

    function getVaults(address _user) external view returns (Vault[] memory) {
        return vaults[_user];
    }

    function getVault(
        address _user,
        uint256 _idx
    ) external view returns (Vault memory) {
        require(_idx < vaults[_user].length, "Invalid vault index");
        return vaults[_user][_idx];
    }

    // ---------------- INTERNAL ----------------

    /// @notice Prepares the encrypted key and IV for storage, allowing default access to the contract and sender.
    /// @return encryptedKey the prepared encrypted key
    /// @return encryptedIv the prepared encrypted IV
    function _prepareEncryptedKeyAndIv(
        externalEuint128 _encryptedKeyValue,
        externalEuint128 _encryptedIvValue,
        bytes calldata _signature
    ) private returns (euint128 encryptedKey, euint128 encryptedIv) {
        externalEuint128[] memory packed = new externalEuint128[](2);
        packed[0] = _encryptedKeyValue;
        packed[1] = _encryptedIvValue;
        euint128[] memory values = FHE.asEuint128s(packed, _signature);
        encryptedKey = values[0];
        encryptedIv = values[1];

        FHE.allowThis(encryptedKey);
        FHE.allowSender(encryptedKey);
        FHE.allowThis(encryptedIv);
        FHE.allowSender(encryptedIv);
    }
}
