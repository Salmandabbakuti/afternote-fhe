import {
  VaultAdded as VaultAddedEvent,
  VaultPinged as VaultPingedEvent,
  VaultReleased as VaultReleasedEvent,
  VaultUpdated as VaultUpdatedEvent
} from "../generated/Afternote/Afternote"
import {
  VaultAdded,
  VaultPinged,
  VaultReleased,
  VaultUpdated
} from "../generated/schema"
import { Bytes } from "@graphprotocol/graph-ts"

export function handleVaultAdded(event: VaultAddedEvent): void {
  let entity = new VaultAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.idx = event.params.idx
  entity.owner = event.params.owner
  entity.encryptedKeyHandle = event.params.encryptedKeyHandle
  entity.encryptedIvHandle = event.params.encryptedIvHandle
  entity.ciphertext = event.params.ciphertext
  entity.beneficiaries = changetype<Bytes[]>(event.params.beneficiaries)

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVaultPinged(event: VaultPingedEvent): void {
  let entity = new VaultPinged(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.idx = event.params.idx
  entity.owner = event.params.owner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVaultReleased(event: VaultReleasedEvent): void {
  let entity = new VaultReleased(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.idx = event.params.idx
  entity.owner = event.params.owner
  entity.caller = event.params.caller
  entity.beneficiaries = changetype<Bytes[]>(event.params.beneficiaries)

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleVaultUpdated(event: VaultUpdatedEvent): void {
  let entity = new VaultUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.idx = event.params.idx
  entity.owner = event.params.owner
  entity.encryptedKeyHandle = event.params.encryptedKeyHandle
  entity.encryptedIvHandle = event.params.encryptedIvHandle
  entity.ciphertext = event.params.ciphertext
  entity.beneficiaries = changetype<Bytes[]>(event.params.beneficiaries)

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
