import solana
from solana.rpc.api import Client

nftPubKeys = []
client = Client("https://api.mainnet-beta.solana.com")

PUBLIC_KEY = solana.publickey.PublicKey("7Cews3bfUGKmHi7n2NAW3zLuyZW1vSL8LE4F27m7FXW6")
splAccount = solana.rpc.types.TokenAccountOpts(program_id=solana.publickey.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"))
tokens = client.get_token_accounts_by_owner(PUBLIC_KEY, splAccount)
tokenPubKeys = [item['pubkey'] for item in tokens['result']['value']]
for pubkey in tokenPubKeys:
    data = client.get_token_account_balance(pubkey)
    if data['result']['value']['amount'] == '1' and data['result']['value']['decimals'] == 0:
        nftPubKeys.append(pubkey)

print(nftPubKeys)