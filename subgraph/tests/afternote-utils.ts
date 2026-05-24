import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import {
  VaultAdded,
  VaultPinged,
  VaultReleased,
  VaultUpdated
} from "../generated/Afternote/Afternote"

export function createVaultAddedEvent(
  idx: BigInt,
  owner: Address,
  encryptedKeyHandle: Bytes,
  encryptedIvHandle: Bytes,
  ciphertext: Bytes,
  beneficiaries: Array<Address>
): VaultAdded {
  let vaultAddedEvent = changetype<VaultAdded>(newMockEvent())

  vaultAddedEvent.parameters = new Array()

  vaultAddedEvent.parameters.push(
    new ethereum.EventParam("idx", ethereum.Value.fromUnsignedBigInt(idx))
  )
  vaultAddedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  vaultAddedEvent.parameters.push(
    new ethereum.EventParam(
      "encryptedKeyHandle",
      ethereum.Value.fromFixedBytes(encryptedKeyHandle)
    )
  )
  vaultAddedEvent.parameters.push(
    new ethereum.EventParam(
      "encryptedIvHandle",
      ethereum.Value.fromFixedBytes(encryptedIvHandle)
    )
  )
  vaultAddedEvent.parameters.push(
    new ethereum.EventParam("ciphertext", ethereum.Value.fromBytes(ciphertext))
  )
  vaultAddedEvent.parameters.push(
    new ethereum.EventParam(
      "beneficiaries",
      ethereum.Value.fromAddressArray(beneficiaries)
    )
  )

  return vaultAddedEvent
}

export function createVaultPingedEvent(
  idx: BigInt,
  owner: Address
): VaultPinged {
  let vaultPingedEvent = changetype<VaultPinged>(newMockEvent())

  vaultPingedEvent.parameters = new Array()

  vaultPingedEvent.parameters.push(
    new ethereum.EventParam("idx", ethereum.Value.fromUnsignedBigInt(idx))
  )
  vaultPingedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return vaultPingedEvent
}

export function createVaultReleasedEvent(
  idx: BigInt,
  owner: Address,
  caller: Address,
  beneficiaries: Array<Address>
): VaultReleased {
  let vaultReleasedEvent = changetype<VaultReleased>(newMockEvent())

  vaultReleasedEvent.parameters = new Array()

  vaultReleasedEvent.parameters.push(
    new ethereum.EventParam("idx", ethereum.Value.fromUnsignedBigInt(idx))
  )
  vaultReleasedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  vaultReleasedEvent.parameters.push(
    new ethereum.EventParam("caller", ethereum.Value.fromAddress(caller))
  )
  vaultReleasedEvent.parameters.push(
    new ethereum.EventParam(
      "beneficiaries",
      ethereum.Value.fromAddressArray(beneficiaries)
    )
  )

  return vaultReleasedEvent
}

export function createVaultUpdatedEvent(
  idx: BigInt,
  owner: Address,
  encryptedKeyHandle: Bytes,
  encryptedIvHandle: Bytes,
  ciphertext: Bytes,
  beneficiaries: Array<Address>
): VaultUpdated {
  let vaultUpdatedEvent = changetype<VaultUpdated>(newMockEvent())

  vaultUpdatedEvent.parameters = new Array()

  vaultUpdatedEvent.parameters.push(
    new ethereum.EventParam("idx", ethereum.Value.fromUnsignedBigInt(idx))
  )
  vaultUpdatedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  vaultUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "encryptedKeyHandle",
      ethereum.Value.fromFixedBytes(encryptedKeyHandle)
    )
  )
  vaultUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "encryptedIvHandle",
      ethereum.Value.fromFixedBytes(encryptedIvHandle)
    )
  )
  vaultUpdatedEvent.parameters.push(
    new ethereum.EventParam("ciphertext", ethereum.Value.fromBytes(ciphertext))
  )
  vaultUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "beneficiaries",
      ethereum.Value.fromAddressArray(beneficiaries)
    )
  )

  return vaultUpdatedEvent
}
