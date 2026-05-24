import { Bytes, BigInt, Address, log } from "@graphprotocol/graph-ts";
import {
  VaultAdded as VaultAddedEvent,
  VaultPinged as VaultPingedEvent,
  VaultReleased as VaultReleasedEvent,
  VaultUpdated as VaultUpdatedEvent
} from "../generated/Afternote/Afternote";
import { Vault } from "../generated/schema";

const RELEASE_DELAY_SECONDS = BigInt.fromI32(10 * 24 * 60 * 60); // 10 day delay as in contract

function getVaultId(owner: Address, idx: BigInt): string {
  return owner.toHex() + "-" + idx.toString();
}

function getReleaseAt(lastActiveAt: BigInt): BigInt {
  return lastActiveAt.plus(RELEASE_DELAY_SECONDS);
}


export function handleVaultAdded(event: VaultAddedEvent): void {
  const owner = event.params.owner;
  const idx = event.params.idx;
  const blockTimestamp = event.block.timestamp;

  const vaultId = getVaultId(owner, idx);
  let vault = new Vault(vaultId);

  vault.idx = idx;
  vault.owner = owner;
  vault.encryptedKeyHandle = event.params.encryptedKeyHandle;
  vault.encryptedIvHandle = event.params.encryptedIvHandle;
  vault.ciphertext = event.params.ciphertext;
  vault.beneficiaries = changetype<Bytes[]>(event.params.beneficiaries);
  vault.lastActiveAt = blockTimestamp;
  vault.isReleased = false;
  vault.releaseAt = getReleaseAt(blockTimestamp);
  vault.createdAt = blockTimestamp;
  vault.updatedAt = blockTimestamp;
  vault.save();

}

export function handleVaultUpdated(event: VaultUpdatedEvent): void {
  const owner = event.params.owner;
  const idx = event.params.idx;
  const blockTimestamp = event.block.timestamp;

  const vaultId = getVaultId(owner, idx);
  let vault = Vault.load(vaultId);

  if (!vault) {
    log.warning(
      "handleVaultUpdated skipped because vault {} does not exist yet",
      [vaultId]
    );
    return;
  }

  vault.encryptedKeyHandle = event.params.encryptedKeyHandle;
  vault.encryptedIvHandle = event.params.encryptedIvHandle;
  vault.ciphertext = event.params.ciphertext;
  vault.beneficiaries = changetype<Bytes[]>(event.params.beneficiaries);
  vault.lastActiveAt = blockTimestamp;
  vault.releaseAt = getReleaseAt(blockTimestamp);
  vault.updatedAt = blockTimestamp;
  vault.save();
}

export function handleVaultPinged(event: VaultPingedEvent): void {
  const owner = event.params.owner;
  const idx = event.params.idx;
  const blockTimestamp = event.block.timestamp;

  const vaultId = getVaultId(owner, idx);
  let vault = Vault.load(vaultId);

  if (!vault) {
    log.warning(
      "handleVaultPinged skipped because vault {} does not exist yet",
      [vaultId]
    );
    return;
  }

  vault.lastActiveAt = blockTimestamp;
  vault.releaseAt = getReleaseAt(blockTimestamp);
  vault.updatedAt = blockTimestamp;
  vault.save();

}

export function handleVaultReleased(event: VaultReleasedEvent): void {
  const owner = event.params.owner;
  const idx = event.params.idx;
  const blockTimestamp = event.block.timestamp;
  const vaultId = getVaultId(owner, idx);
  let vault = Vault.load(vaultId);

  if (!vault) {
    log.warning(
      "handleVaultReleased skipped because vault {} does not exist yet",
      [vaultId]
    );
    return;
  }
  vault.isReleased = true;
  vault.releaseAt = blockTimestamp;
  vault.updatedAt = blockTimestamp;
  vault.save();
}
