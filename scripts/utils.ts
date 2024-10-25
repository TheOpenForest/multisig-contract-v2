import { sleep } from "@ton/blueprint";
import { Address, beginCell, Cell, internal, toNano } from "@ton/core"

export const blackholeAddress = Address.parse('EQD__________________________________________0vo')

export const Op = {
    new_order: 0xf718510f,
    execute: 0x75097f5d,
    execute_internal: 0xa32c59bf,

    init: 0x9c73fba2,
    approve: 0xa762230f,
    approve_accepted: 0x82609bf6,
    approve_rejected: 0xafaf283e,

    send_message: 0xf1381e5b,
    update_multisig_params: 0x1d0cfbd3,
}

export const sleepMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function getJettonInternalTransferMsg(jettonAmount: bigint, toAddress: Address, responseAddress: Address, queryId: number = 0) {
    const internalTransferPayload = beginCell()
        .storeUint(0x178d4519, 32) // internal_transfer
        .storeUint(queryId, 64) // query_id
        .storeCoins(jettonAmount) // jetton amount
        .storeAddress(responseAddress) // from address (may be ignored)
        .storeAddress(responseAddress) // response address
        .storeCoins(0) // forward payload
        .storeBit(false) // no forward
        .endCell();

    return internal({
        to: toAddress,
        value: toNano('0.5'),
        body: internalTransferPayload
    })
}

export function getTonTransferMsg(toAddress: Address, tonAmount: bigint, comment?: string) {
    return internal({
        to: toAddress,
        value: tonAmount,
        body: comment ? beginCell().storeUint(0, 32).storeStringTail(comment).endCell() : Cell.EMPTY
    })
}