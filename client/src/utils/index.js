import { Ethers6Adapter } from "@cofhe/sdk/adapters";
import { createCofheClient, createCofheConfig } from "@cofhe/sdk/web";
import { chains } from "@cofhe/sdk/chains";
import {
  JsonRpcProvider,
  Contract,
  toBeArray,
  toBigInt,
  hexlify,
  getBytes
} from "ethers";
import { GraphQLClient } from "graphql-request";
import { AFTERNOTE_CONTRACT_ADDRESS, SUBGRAPH_URL } from "./constants";

export const subgraphClient = new GraphQLClient(SUBGRAPH_URL);

export const sepoliaProvider = new JsonRpcProvider(
  "https://sepolia.drpc.org",
  11155111,
  { staticNetwork: true }
);

const config = createCofheConfig({ supportedChains: [chains.sepolia] });
const cofheClient = createCofheClient(config);

export const getCofheClient = async (provider, signer) => {
  if (!signer || !provider)
    throw new Error("CofheClient: Signer and Provider are required!");

  const { publicClient, walletClient } = await Ethers6Adapter(provider, signer);

  await cofheClient.connect(publicClient, walletClient);
  return cofheClient;
};

export const bigIntToUint8Array = (value) => toBeArray(value, 16);
export const uint8ArrayToBigInt = (bytes) => toBigInt(bytes);
export const uint8ArrayToHex = (bytes) => hexlify(bytes);
export const hexToUint8Array = (hex) => getBytes(hex);

export const encryptText = async (text) => {
  const crypto = globalThis.crypto;
  const aesKeyBytes = crypto.getRandomValues(new Uint8Array(16)); // AES-128 key
  const ivBytes = crypto.getRandomValues(new Uint8Array(12)); // AES-GCM nonce

  const key = await crypto.subtle.importKey(
    "raw",
    aesKeyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const plainTextBytes = new TextEncoder().encode(text);
  const cipherText = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    plainTextBytes
  );

  return {
    cipherTextBytes: new Uint8Array(cipherText),
    aesKeyBytes,
    ivBytes
  };
};

export const decryptText = async (cipherTextBytes, ivBytes, aesKeyBytes) => {
  const crypto = globalThis.crypto;
  const key = await crypto.subtle.importKey(
    "raw",
    aesKeyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const decryptedBytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    cipherTextBytes
  );

  return new TextDecoder().decode(decryptedBytes);
};

const AFTERNOTE_ABI = [
  "function addVault(tuple(uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) _encryptedKeyValue, tuple(uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) _encryptedIvValue, bytes _ciphertext, address[] _beneficiaries)",
  "function getVaultById(address _user, uint256 _vaultIndex) view returns (tuple(bytes32 encryptedKey, bytes32 encryptedIv, bytes ciphertext, address[] beneficiaries, uint64 createdAt, uint64 lastActiveAt, bool isReleased))",
  "function ping(uint256 _vaultIndex)",
  "function release(address _owner, uint256 _vaultIndex)",
  "function updateVault(uint256 _vaultIndex, tuple(uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) _encryptedKeyValue, tuple(uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature) _encryptedIvValue, bytes _ciphertext, address[] _beneficiaries)",
  "function vaults(address, uint256) view returns (bytes32 encryptedKey, bytes32 encryptedIv, uint64 createdAt, uint64 lastActiveAt, bool isReleased)",
  "function getVaults() view returns (tuple(bytes32 encryptedKey, bytes32 encryptedIv, bytes ciphertext, address[] beneficiaries, uint64 createdAt, uint64 lastActiveAt, bool isReleased)[])",
  "event VaultAdded(uint256 indexed idx, address indexed owner, bytes32 indexed encryptedKeyHandle, bytes32 encryptedIvHandle, bytes ciphertext, address[] beneficiaries)"
];

export const afternoteContract = new Contract(
  AFTERNOTE_CONTRACT_ADDRESS,
  AFTERNOTE_ABI,
  sepoliaProvider
);

export const ellipsisString = (str, start = 6, end = 4) => {
  if (str.length <= start + end) return str;
  return `${str.slice(0, start)}...${str.slice(-end)}`;
};
