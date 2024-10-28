import { Address, beginCell, Cell, internal, toNano } from "@ton/core"

export abstract class JettonOp {
    // to Wallet
    static readonly JettonTransfer = 0x0f8a7ea5
    static readonly JettonCallTo = 0x235caf52

    // to Jetton Wallet
    static readonly JettonInternalTransfer = 0x178d4519
    static readonly JettonNotify = 0x7362d09c
    static readonly JettonBurn = 0x595f07bc
    static readonly JettonBurnNotification = 0x7bdd97de
    static readonly JettonSetStatus = 0xeed236d3

    // to Jetton Master
    static readonly JettonMint = 0x642b7d07
    static readonly JettonChangeAdmin = 0x6501f354
    static readonly JettonClaimAdmin = 0xfb88e119
    static readonly JettonDropAdmin = 0x7431f221
    static readonly JettonChangeMetadata = 0xcb862902
    static readonly JettonUpgrade = 0x2508d66a
}

export const blackholeAddress = Address.parse('EQD__________________________________________0vo')

export const sleepMs = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export function getJettonInternalTransferMsg(jettonAmount: bigint, toAddress: Address, responseAddress: Address, queryId: number = 0) {
    const internalTransferPayload = beginCell()
        .storeUint(JettonOp.JettonInternalTransfer, 32) // internal_transfer
        .storeUint(queryId, 64) // query_id
        .storeCoins(jettonAmount) // jetton amount
        .storeAddress(responseAddress) // from address (may be ignored)
        .storeAddress(responseAddress) // response address
        .storeCoins(0) // forward payload
        .storeBit(false) // no forwardㄉ
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