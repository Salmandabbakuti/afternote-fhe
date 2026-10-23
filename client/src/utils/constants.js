import { gql } from "graphql-request";

export const AFTERNOTE_CONTRACT_ADDRESS =
  "0x1b03466F029193705FF309563C6153b61CE3d106";

export const RELEASE_DELAY_SECONDS = 10 * 24 * 60 * 60;

export const SEPOLIA_CHAIN_ID = "11155111";

export const SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/32812/afternote-fhe/v0.2.3";

export const GET_VAULTS_QUERY = gql`
  query GetVaults(
    $skip: Int
    $first: Int
    $orderBy: Vault_orderBy
    $orderDirection: OrderDirection
    $where: Vault_filter
  ) {
    vaults(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      idx
      beneficiaries
      lastActiveAt
      releaseAt
      isReleased
      createdAt
      updatedAt
    }
  }
`;

export const GET_DECRYPTABLE_VAULTS_QUERY = gql`
  query GetVaults(
    $skip: Int
    $first: Int
    $orderBy: Vault_orderBy
    $orderDirection: OrderDirection
    $where: Vault_filter
  ) {
    vaults(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      idx
      owner
      encryptedKeyHandle
      encryptedIvHandle
      ciphertext
      beneficiaries
      isReleased
      createdAt
      updatedAt
      lastActiveAt
      releaseAt
    }
  }
`;

export const GET_VAULT_BY_ID_QUERY = gql`
  query GetVaultById($id: ID!) {
    vault(id: $id) {
      id
      idx
      owner
      encryptedKeyHandle
      encryptedIvHandle
      ciphertext
      beneficiaries
      isReleased
      createdAt
      updatedAt
      lastActiveAt
      releaseAt
    }
  }
`;
