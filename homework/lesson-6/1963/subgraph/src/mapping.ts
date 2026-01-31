import { BigInt } from "@graphprotocol/graph-ts";
import { ValueUpdated } from "../generated/ERC1963/ERC1963";
import { ValueUpdate } from "../generated/schema";

export function handleValueUpdated(event: ValueUpdated): void {
  const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  const entity = new ValueUpdate(id);
  entity.user = event.params.user;
  entity.newValue = event.params.newValue;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();
}
