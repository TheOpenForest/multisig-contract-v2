import { Address, beginCell, internal, SendMode, toNano } from '@ton/core';
import { Multisig } from '../wrappers/Multisig';
import { compile, NetworkProvider, UIProvider } from '@ton/blueprint';
import { blackholeAddress, getTonTransferMsg, sleepMs } from "./utils";

async function userPrompt(ui: UIProvider): Promise<{
    multisigAddress: Address,
    expireAfterSeconds: number,
    proposerInfo: {
        isSigner: boolean,
        index: number,
    },
    orderSeqno: bigint
}> {
    const multisigAddress = await ui.inputAddress('Enter multisig address');
    const expireAfterSeconds = Number(await ui.input('Enter expiration date in seconds (number only)'));
    const isSigner: boolean = await ui.choose('Is proposer signer?', [true, false], (x) => x ? 'yes' : 'no');
    const index = Number(await ui.input('Enter proposer address book index (number only)'));
    const orderSeqno = BigInt(await ui.input('Enter order seqno (number only)'));

    return { multisigAddress, expireAfterSeconds, proposerInfo: { isSigner, index }, orderSeqno };
}

export async function run(provider: NetworkProvider) {
    // prompt user
    const ui = provider.ui()
    const params = await userPrompt(ui);

    // multisig should be deployed
    const _multisig = provider.open(new Multisig(params.multisigAddress));
    const { nextOrderSeqno, threshold, signers, proposers } = await _multisig.getMultisigData();
    const multisig = new Multisig(params.multisigAddress, undefined, {
        threshold: Number(threshold),
        signers,
        proposers,
        allowArbitrarySeqno: nextOrderSeqno === -1n ? true : false
    });
    multisig.orderSeqno = nextOrderSeqno;
    const multiownerWallet = provider.open(multisig);

    console.log(`multisig contract config: ${JSON.stringify({
        nextOrderSeqno: Number(nextOrderSeqno),
        threshold: Number(threshold),
        signers: signers.map(a => a.toString()),
        proposers: proposers.map(a => a.toString()),
    }, null, 2)}`);

    // action: ton transfer (3 ton)
    const messagePayload = getTonTransferMsg(Address.parse("0QDrC2F-S08ss7dzaAHPiSERynMgRAngojBlNxGtoV6BalRI"), toNano("3"));

    // create new order
    await multiownerWallet.sendNewOrder(provider.sender(),
        [{
            type: 'transfer',
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            message: messagePayload
        }],
        Math.floor(Date.now() / 1000 + params.expireAfterSeconds), // expired in hour
        toNano('0.005'), // ton amount
        params.proposerInfo.index, // index
        params.proposerInfo.isSigner, // not signer
        params.orderSeqno // order_seqno
    );

    // wait for deployment
    let orderAddress = null;
    while (!orderAddress) {
        await sleepMs(1000);
        try {
            orderAddress = await multiownerWallet.getOrderAddress(params.orderSeqno)
            console.log("Order address:", orderAddress);
        } catch (e) {
            await sleepMs(3000);
        }
    }
}
