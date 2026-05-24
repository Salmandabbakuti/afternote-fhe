import { Bytes } from "@graphprotocol/graph-ts";
import {
  VaultAdded as VaultAddedEvent,
  VaultPinged as VaultPingedEvent,
  VaultReleased as VaultReleasedEvent,
  VaultUpdated as VaultUpdatedEvent
} from "../generated/Afternote/Afternote";
import { Vault } from "../generated/schema";

export function handleVaultAdded(event: VaultAddedEvent): void {

}

export function handleVaultUpdated(event: VaultUpdatedEvent): void {

}

export function handleVaultPinged(event: VaultPingedEvent): void {

}

export function handleVaultReleased(event: VaultReleasedEvent): void {

}
