import solana
from spl import token
import spl.token._layouts as layouts
from spl.token.constants import TOKEN_PROGRAM_ID
from solana.utils.helpers import decode_byte_string
from spl.token import instructions
import json
from solana.rpc.api import Client
import random

def getSolanaUrl():
    return random.choice(["https://free.rpcpool.com", "https://orca.rpcpool.com", "https://api.mainnet-beta.solana.com", "https://solana-api.projectserum.com"])



def sendNft(FROM_PUBKEY, TO_PUBKEY, NFT_MINTI):
    client = Client(getSolanaUrl())
    NFT_MINT = str(client.get_account_info(solana.publickey.PublicKey(NFT_MINTI), encoding="jsonParsed")['result']['value']['data']['parsed']['info']['mint'])
    seed = open("./seeds/" + FROM_PUBKEY, "rb").read()

    fromKeypair = solana.keypair.Keypair.from_seed(seed)
    FEE_PAYER = "4TpMG3FE47ZYaQe8XhQMzKtqXbKR7L3fYfbfgkKJRxf4"
    FEE_PAYER_SEED = open("./seeds/" + FEE_PAYER, "rb").read()
    FEE_PAYER_KEYPAIR = solana.keypair.Keypair.from_seed(FEE_PAYER_SEED)
    FEE_PAYER_PUBLICKEY = solana.publickey.PublicKey(FEE_PAYER)
    recentBlockhash = solana.blockhash.Blockhash(client.get_recent_blockhash()['result']['value']['blockhash'])

    toke = instructions.get_associated_token_address(solana.publickey.PublicKey(FROM_PUBKEY),
                                                     solana.publickey.PublicKey(NFT_MINT))
    destacct = instructions.get_associated_token_address(solana.publickey.PublicKey(TO_PUBKEY),
                                                         solana.publickey.PublicKey(NFT_MINT))

    createATA = instructions.create_associated_token_account(solana.publickey.PublicKey(FROM_PUBKEY),
                                                             solana.publickey.PublicKey(TO_PUBKEY),
                                                             solana.publickey.PublicKey(NFT_MINT))

    transaction2 = solana.transaction.Transaction(fee_payer=FEE_PAYER_PUBLICKEY, recent_blockhash=recentBlockhash)
    transaction2.add(createATA)
    transaction2.sign(FEE_PAYER_KEYPAIR, fromKeypair)
    opts2 = solana.rpc.types.TxOpts()
    tx2 = transaction2.serialize()
    try:
        resp = client.send_raw_transaction(tx2, opts2)
    except:
        pass

    tokenTransParams = instructions.TransferCheckedParams(amount=1,
                                                          decimals=0,
                                                          dest=destacct,
                                                          mint=solana.publickey.PublicKey(NFT_MINT),
                                                          owner=solana.publickey.PublicKey(FROM_PUBKEY),
                                                          program_id=solana.publickey.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
                                                          source=toke)
    transferInstructions = instructions.transfer_checked(tokenTransParams)
    transaction = solana.transaction.Transaction(fee_payer=FEE_PAYER_PUBLICKEY, recent_blockhash=recentBlockhash)
    transaction.add(transferInstructions)
    transaction.sign(FEE_PAYER_KEYPAIR, fromKeypair)

    opts = solana.rpc.types.TxOpts()
    tx = transaction.serialize()
    resp = client.send_raw_transaction(tx, opts)


    return resp

def sendSol(FROM_PUBKEY, TO_PUBKEY, SOLAMT):
    SOLAMT = int(SOLAMT / 0.000000001)
    seed = open("./seeds/" + FROM_PUBKEY, "rb").read()
    fromKeypair = solana.keypair.Keypair().from_seed(seed)
    client = Client(getSolanaUrl())

    FEE_PAYER = "4TpMG3FE47ZYaQe8XhQMzKtqXbKR7L3fYfbfgkKJRxf4"
    FEE_PAYER_SEED = open("./seeds/" + FEE_PAYER, "rb").read()
    FEE_PAYER_KEYPAIR = solana.keypair.Keypair.from_seed(FEE_PAYER_SEED)
    FEE_PAYER_PUBLICKEY = solana.publickey.PublicKey(FEE_PAYER)
    recentBlockhash = solana.blockhash.Blockhash(client.get_recent_blockhash()['result']['value']['blockhash'])

    transaction = solana.transaction.Transaction(fee_payer=FEE_PAYER_PUBLICKEY, recent_blockhash=recentBlockhash)

    transferParams = solana.system_program.TransferParams(from_pubkey=solana.publickey.PublicKey(FROM_PUBKEY),
                                                                lamports=SOLAMT,
                                                                to_pubkey=solana.publickey.PublicKey(TO_PUBKEY))
    transferInstructions = solana.system_program.transfer(transferParams)
    transaction.add(transferInstructions)
    transaction.sign(FEE_PAYER_KEYPAIR, fromKeypair)

    opts = solana.rpc.types.TxOpts()
    tx = transaction.serialize()
    resp = client.send_raw_transaction(tx, opts)

    return resp

#resp = sendNft("EjgdhxEQeeiaf7sxyu9SsutxQEM2Myk7nwYT2bUyC5Km", "7Cews3bfUGKmHi7n2NAW3zLuyZW1vSL8LE4F27m7FXW6", "LajTaczd1jDJtpeivMLbR7UWE6YGRSg8SRBkCXCRCTs")
resp = sendSol("EjgdhxEQeeiaf7sxyu9SsutxQEM2Myk7nwYT2bUyC5Km", "7Cews3bfUGKmHi7n2NAW3zLuyZW1vSL8LE4F27m7FXW6", 0.005)
print(resp)

