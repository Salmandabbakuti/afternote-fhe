import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { VaultAdded } from "../generated/schema"
import { VaultAdded as VaultAddedEvent } from "../generated/Afternote/Afternote"
import { handleVaultAdded } from "../src/afternote"
import { createVaultAddedEvent } from "./afternote-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#tests-structure

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let idx = BigInt.fromI32(234)
    let owner = Address.fromString("0x0000000000000000000000000000000000000001")
    let encryptedKeyHandle = Bytes.fromI32(1234567890)
    let encryptedIvHandle = Bytes.fromI32(1234567890)
    let ciphertext = Bytes.fromI32(1234567890)
    let beneficiaries = [
      Address.fromString("0x0000000000000000000000000000000000000001")
    ]
    let newVaultAddedEvent = createVaultAddedEvent(
      idx,
      owner,
      encryptedKeyHandle,
      encryptedIvHandle,
      ciphertext,
      beneficiaries
    )
    handleVaultAdded(newVaultAddedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#write-a-unit-test

  test("VaultAdded created and stored", () => {
    assert.entityCount("VaultAdded", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "VaultAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "idx",
      "234"
    )
    assert.fieldEquals(
      "VaultAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "owner",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "VaultAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "encryptedKeyHandle",
      "1234567890"
    )
    assert.fieldEquals(
      "VaultAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "encryptedIvHandle",
      "1234567890"
    )
    assert.fieldEquals(
      "VaultAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "ciphertext",
      "1234567890"
    )
    assert.fieldEquals(
      "VaultAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "beneficiaries",
      "[0x0000000000000000000000000000000000000001]"
    )

    // More assert options:
    // https://thegraph.com/docs/en/subgraphs/developing/creating/unit-testing-framework/#asserts
  })
})
