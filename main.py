from flask import Flask, jsonify, request, render_template, send_from_directory, make_response, redirect, url_for
from flask_cors import CORS
import solana
from spl import token
from spl.token import instructions
import json
from solana.rpc.api import Client
from theblockchainapi import TheBlockchainAPIResource, SolanaNetwork
import random
import string
app = Flask(__name__, static_url_path='/static')
CORS(app)

##SET 1
#MY_API_KEY_ID = "APQjOuExwhZhzjp"
#MY_API_SECRET_KEY = "C0a8i4PA1y5qZhz"

##SET 3
#MY_API_KEY_ID = "9xIRb8xFi0cJPQA"
#MY_API_SECRET_KEY = "h19XUQIJ34tshCl"

##SET 4
#MY_API_KEY_ID = "0yC5y0e0CMMtph5"
#MY_API_SECRET_KEY = "DnxIZHBmaUlgG29"

##SET 2
MY_API_KEY_ID = "on1HGVilKrgxrUE"
MY_API_SECRET_KEY = "eVWIhdgf3pasDoM"
BLOCKCHAIN_API_RESOURCE = TheBlockchainAPIResource(
    api_key_id=MY_API_KEY_ID,
    api_secret_key=MY_API_SECRET_KEY
)

client = Client("https://free.rpcpool.com")

def getSolanaUrl():
    return random.choice(["https://free.rpcpool.com", "https://orca.rpcpool.com", "https://api.mainnet-beta.solana.com", "https://solana-api.projectserum.com"])

def delete_offer(tradeOfferId, userid):
    ownerid = userid

    tradeOfferAccounts = json.load(open("./tradeOfferAccounts.json", "r"))
    sender, receiver = tradeOfferAccounts[tradeOfferId]['sender'], tradeOfferAccounts[tradeOfferId]['receiver']
    del tradeOfferAccounts

    isMember = False
    userData = json.load(open("./userCredentials.json", "r"))
    for user in userData:
        if user['accountid'] == ownerid:
            if user['username'] == sender or user['username'] == receiver:
                isMember = True
                break
    if isMember:
        tradeOfferAccounts = json.load(open("./tradeOfferAccounts.json", "r"))
        del tradeOfferAccounts[tradeOfferId]
        json.dump(tradeOfferAccounts, open("./tradeOfferAccounts.json", "w"))
        del tradeOfferAccounts

        tradeOffersData = json.load(open("./tradeOffers.json", "r"))
        del tradeOffersData[tradeOfferId]
        json.dump(tradeOffersData, open("./tradeOffers.json", "w"))
        del tradeOffersData

        userData = json.load(open("./userCredentials.json", "r"))
        for user in userData:
            if user['username'] == receiver:
                receiverid = user['accountid']
            if user['username'] == sender:
                senderid = user['accountid']
        del userData

        userOffers = json.load(open("./usersOffers.json", "r"))
        userOffers[senderid].remove(tradeOfferId)
        userOffers[receiverid].remove(tradeOfferId)
        json.dump(userOffers, open("./usersOffers.json", "w"))
        return "success"

def sendSol(FROM_PUBKEY, TO_PUBKEY, SOLAMT):
    SOLAMT = int(SOLAMT / 0.000000001)
    seed = open("./seeds/" + FROM_PUBKEY, "rb").read()
    fromKeypair = solana.keypair.Keypair().from_seed(seed)

    transaction = solana.transaction.Transaction()

    transferParams = solana.system_program.TransferParams(from_pubkey=solana.publickey.PublicKey(FROM_PUBKEY),
                                                                lamports=SOLAMT,
                                                                to_pubkey=solana.publickey.PublicKey(TO_PUBKEY))
    transferInstructions = solana.system_program.transfer(transferParams)
    transaction.add(transferInstructions)

    resp = client.send_transaction(transaction, fromKeypair)
    return resp

def sendNft(FROM_PUBKEY, TO_PUBKEY, NFT_MINTI):
    NFT_MINT = str(client.get_account_info(solana.publickey.PublicKey(NFT_MINTI), encoding="jsonParsed")['result']['value']['data']['parsed']['info']['mint'])
    seed = open("./seeds/" + FROM_PUBKEY, "rb").read()
    fromKeypair = solana.keypair.Keypair.from_seed(seed)
    transaction = solana.transaction.Transaction()
    toke = instructions.get_associated_token_address(solana.publickey.PublicKey(FROM_PUBKEY),
                                                     solana.publickey.PublicKey(NFT_MINT))
    destacct = instructions.get_associated_token_address(solana.publickey.PublicKey(TO_PUBKEY),
                                                         solana.publickey.PublicKey(NFT_MINT))
    createATA = instructions.create_associated_token_account(solana.publickey.PublicKey(FROM_PUBKEY),
                                                    solana.publickey.PublicKey(TO_PUBKEY),
                                                         solana.publickey.PublicKey(NFT_MINT))
    transaction2 = solana.transaction.Transaction()
    transaction2.add(createATA)
    try:
        client.send_transaction(transaction2, fromKeypair)
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
    transaction.add(transferInstructions)
    resp = client.send_transaction(transaction, fromKeypair)
    return resp

def updateNfts(PUBLIC_KEY_STR):
    mintToUrl = json.load(open("./mintToMetaData.json", "r"))
    addressToMint = json.load(open("./publickeyToMint.json", "r"))

    nftPubKeys = []
    PUBLIC_KEY = solana.publickey.PublicKey(PUBLIC_KEY_STR)

    addressToMint[PUBLIC_KEY_STR] = []
    addresseses = addressToMint[PUBLIC_KEY_STR]

    splAccount = solana.rpc.types.TokenAccountOpts(program_id=solana.publickey.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"))
    tokens = client.get_token_accounts_by_owner(PUBLIC_KEY, splAccount)
    tokenPubKeys = [item['pubkey'] for item in tokens['result']['value']]
    for pubkey in tokenPubKeys:
        data = client.get_token_account_balance(pubkey)
        if data['result']['value']['amount'] == '1' and data['result']['value']['decimals'] == 0:

            mintKey = client.get_account_info(pubkey, encoding="jsonParsed")['result']['value']['data']['parsed']['info']['mint']
            nft_metadata = BLOCKCHAIN_API_RESOURCE.get_nft_metadata(
                mint_address=mintKey,
                network=SolanaNetwork.MAINNET_BETA
            )
            mintToUrl[pubkey] = nft_metadata['data']['uri']
            if pubkey not in addresseses:
                addresseses.append(pubkey)
            nftPubKeys.append((pubkey, nft_metadata['data']['uri']))
    json.dump(mintToUrl, open("./mintToMetaData.json", "w"))
    json.dump(addressToMint, open("./publickeyToMint.json", "w"))
    return nftPubKeys

@app.route('/withdraw/sol', methods=['POST'])
def withdraw_sol():
    session = json.load(open("./session.json", "r"))
    ownerid = session[request.cookies.get("sessionid")]
    del session

    userAccounts = json.load(open("./accounts.json", "r"))
    ownerPubkey = userAccounts[ownerid]
    del userAccounts

    solAmount = request.form['solAmt']
    withdrawPubkey = request.form['withdrawPubkey']
    print(solAmount)

    client2 = Client(getSolanaUrl())
    resp = client2.get_balance(solana.publickey.PublicKey(ownerPubkey))

    if float(solAmount) < float(resp['result']['value'] * 0.000000001):
        try:
            sendSol(ownerPubkey, withdrawPubkey, float(solAmount))
            return "success"
        except Exception as e:
            return "failed"
    return "failed"

@app.route('/search/users', methods=['GET'])
def search_users():
    query = request.args['query']
    userCreds = json.load(open("./userCredentials.json", "r"))
    searchCount = 10
    returnList = []
    for user in userCreds:
        if searchCount == 0:
            break
        if query in user['username']:
            returnList.append(user['username'])
            searchCount -= 1
    return jsonify(returnList)

@app.route('/browse', methods=['GET'])
def browse_available():
    return render_template("browse.html")

@app.route('/browse/selections', methods=['GET'])
def browse_collections():
    usernamesToMints = []
    userCreds = json.load(open("./userCredentials.json", "r"))
    pubkeysToMints = json.load(open("./publickeyToMint.json", "r"))
    minttoMetadata = json.load(open("./mintToMetaData.json", "r"))
    userAccounts = json.load(open("./accounts.json", "r"))
    counter = 0
    for x in range(100):
        try:
            while len(pubkeysToMints[list(pubkeysToMints.keys())[counter]]) == 0:
                counter += 1
            publicKeyOwner = list(pubkeysToMints.keys())[counter]
            for user in list(userAccounts.keys()):
                publickkey = userAccounts[user]
                if publickkey == publicKeyOwner:
                    for userc in userCreds:
                        if userc['accountid'] == user:
                            username = userc['username']
                    usernamesToMints.append({username: [{mint: minttoMetadata[mint]} for mint in pubkeysToMints[list(pubkeysToMints.keys())[counter]]]})
                    break
            counter += 1
        except:
            return jsonify(
                usernamesToMints
            )

    return jsonify(
        usernamesToMints
    )

@app.route('/withdraw', methods=['POST'])
def withdraw_nft():
    session = json.load(open("./session.json", "r"))
    ownerid = session[request.cookies.get("sessionid")]

    mintAccount = request.form['mint']
    withdrawPubkey = request.form['withdrawPubkey']

    userAccounts = json.load(open("./accounts.json", "r"))
    ownerPubkey = userAccounts[ownerid]
    del userAccounts
    try:
        sendNft(ownerPubkey, withdrawPubkey, mintAccount)
    except:
        return "failed"
    return "success"

@app.route('/trade/cancel', methods=['POST'])
def cancel_trade():
    tradeOfferId = request.form['offerid']
    session = json.load(open("./session.json", "r"))
    ownerid = session[request.cookies.get("sessionid")]
    return delete_offer(tradeOfferId, ownerid)

@app.route('/trade/accept', methods=['POST'])
def accept_trade():
    tradeOfferId = request.form['offerid']
    session = json.load(open("./session.json", "r"))
    ownerid = session[request.cookies.get("sessionid")]

    userCreds = json.load(open("./userCredentials.json", "r"))
    for user in userCreds:
        if user['accountid'] == ownerid:
            ownerUsername = user['username']
    del userCreds

    isReceiver = False
    traderOfferAccounts = json.load(open("./tradeOfferAccounts.json", "r"))
    if traderOfferAccounts[tradeOfferId]['receiver'] == ownerUsername:
        isReceiver = True
    del traderOfferAccounts

    if isReceiver:
        tradeOfferData = json.load(open("./tradeOffers.json"))
        traderOfferSpecific = tradeOfferData[tradeOfferId]
        del tradeOfferData

        recPubkey = traderOfferSpecific['receiver']
        receiverNfts = traderOfferSpecific['receiverNfts']
        sendPubkey = traderOfferSpecific['sender']
        senderNfts = traderOfferSpecific['senderNfts']
        if recPubkey == sendPubkey:
            return "failed00"


        currentReceiverNfts = [item[0] for item in updateNfts(recPubkey)]
        for nft in receiverNfts:
            if nft not in currentReceiverNfts:
                return "failed01"

        currentSenderNfts = [item[0] for item in updateNfts(sendPubkey)]
        for nft in senderNfts:
            if nft not in currentSenderNfts:
                return "failed02"

        for nft in receiverNfts:
            try:
                sendNft(recPubkey, sendPubkey, nft)
            except:
                return "failed03"
        for nft in senderNfts:
            try:
                sendNft(sendPubkey, recPubkey, nft)
            except:
                return "failed04"
        delete_offer(tradeOfferId, ownerid)
        return "success"

@app.route('/accountcreation', methods=['POST'])
def create_new_account():
    if request.method == "POST":
        newuser = request.form['username']
        newpass = request.form['password']
        newuserid = ''.join([random.choice(string.ascii_uppercase+string.digits) for x in range(15)])
        userAccts = json.load(open("./userCredentials.json", "r"))
        for acct in userAccts:
            if acct['username'] == newuser:
                return "Username already in use"
            if acct['accountid'] == newuserid:
                newuserid = ''.join([random.choice(string.ascii_uppercase + string.digits) for x in range(random.choice(11,12,13,14,15))])
        userAccts.append({"username": newuser, "password": newpass, "accountid": newuserid})
        json.dump(userAccts, open("./userCredentials.json", "w"))
        return "created"

@app.route('/logout', methods=['GET'])
def logout():
    if request.method == "GET":
        resp = make_response(redirect("/"))
        resp.set_cookie("sessionid", "",max_age=0)
        return resp

@app.route('/login', methods=['POST'])
def login():
    if request.method == "POST":
        username = request.form['username']
        password = request.form['password']
        userCreds = json.load(open("./userCredentials.json", "r"))
        for cred in userCreds:
            if cred["username"] == username and cred["password"] == password:
                sessionId = ''.join([random.choice(string.ascii_uppercase + string.digits) for x in range(14)])
                session = json.load(open("./session.json", "r"))
                session[sessionId] = cred["accountid"]
                json.dump(session, open("./session.json", "w"))
                resp = make_response(jsonify({"status": "success"}))
                resp.set_cookie("sessionid", sessionId, max_age=60 * 60 * 24)
                return resp

@app.route('/trades/mine', methods=['GET'])
def get_my_trades():
    session = json.load(open("./session.json", "r"))
    userid = session[request.cookies.get("sessionid")]
    del session

    accounts = json.load(open("./accounts.json", "r"))
    userAddr = accounts[userid]
    del accounts

    offers = json.load(open("./usersOffers.json", "r"))
    try:
        useroffers = offers[userid]
    except:
        offers[userid] = []
        useroffers = offers[userid]
        json.dump(offers, open("./usersOffers.json", "w"))
    del offers

    mintMetadata = json.load(open("./mintToMetaData.json", "r"))
    offerData = json.load(open("./tradeOffers.json", "r"))
    offerAccounts = json.load(open("./tradeOfferAccounts.json"))
    returnOfferList = []
    for offer in useroffers:
        memberRole = "sender"
        if offerData[offer]['receiver'] == userAddr:
            memberRole = "receiver"
        returnOfferList.append({
            "offer": offer,
            "sender": offerData[offer]['sender'],
            "receiver": offerData[offer]['receiver'],
            "senderUser": offerAccounts[offer]["sender"],
            "receiverUser": offerAccounts[offer]["receiver"],
            "senderNfts": {mint: mintMetadata[mint] for mint in offerData[offer]['senderNfts']},
            "receiverNfts": {mint: mintMetadata[mint] for mint in offerData[offer]['receiverNfts']},
            "role": memberRole
        })

    return jsonify(returnOfferList)

@app.route('/trade/confirm', methods=['POST'])
def confirm_trade():
    if request.method == "POST":
        session = json.load(open("./session.json", "r"))
        try:
            owner = session[request.cookies.get("sessionid")]
            del session
            ownerNfts = request.form['ownerNfts'].split(";")
            trader = request.form['trader']
            if owner == trader:
                return "failed00"
            traderNfts =  request.form['traderNfts'].split(";")
            solAmt = str(request.form['addedSol'])
            while "" in ownerNfts:
                ownerNfts.remove("")
            while "" in traderNfts:
                traderNfts.remove("")
        except:
            return "failed01"
        if len(traderNfts) == 0 and len(ownerNfts) == 0:
            return "failed02"

        credentials = json.load(open("./userCredentials.json", "r"))
        for cred in credentials:
            if cred['username'] == trader:
                trader = cred['accountid']
                traderUsername = cred['username']
            if cred['accountid'] == owner:
                ownerUsername = cred['username']
        del credentials


        accounts = json.load(open("./accounts.json", "r"))
        ownerAddress = accounts[owner]
        traderAddress = accounts[trader]


        del accounts

        keyMints = json.load(open("./publickeyToMint.json", "r"))

        for nft in ownerNfts:
            if nft not in keyMints[ownerAddress]:
                return "failed03"

        for nft in traderNfts:
            if nft not in keyMints[traderAddress]:
                return "failed04"
        del keyMints

        tradeOfferId = ''.join([random.choice(string.ascii_uppercase+string.digits) for x in range(14)])
        tradeOffers = json.load(open("./tradeOffers.json", "r"))
        while tradeOfferId in tradeOffers:
            tradeOfferId = ''.join([random.choice(string.ascii_uppercase + string.digits) for x in range(14)])

        tradeAccounts = json.load(open("./tradeOfferAccounts.json", "r"))
        tradeAccounts[tradeOfferId] = {"sender": ownerUsername, "receiver": traderUsername}
        json.dump(tradeAccounts, open("./tradeOfferAccounts.json", "w"))

        tradeOffers[tradeOfferId] = {"sender": ownerAddress,
                                     "receiver": traderAddress,
                                     "senderNfts": ownerNfts,
                                     "receiverNfts": traderNfts,
                                     "sol": solAmt}
        json.dump(tradeOffers, open("./tradeOffers.json", "w"))

        userOffers = json.load(open("./usersOffers.json", "r"))

        for act in (owner, trader):
            if act not in userOffers:
                userOffers[act] = [tradeOfferId]
            elif act in userOffers:
                userOffers[act].append(tradeOfferId)

        json.dump(userOffers, open("./usersOffers.json", "w"))

        return "success"

@app.route('/trade/<string:address>', methods=['GET'])
def trade_page(address):
    if request.method == "GET":
        session = json.load(open("./session.json", "r"))
        owner = session[request.cookies.get("sessionid")]
        del session

        userCreds = json.load(open("./userCredentials.json", "r"))
        for user in userCreds:
            if user['accountid'] == owner and user['username'] == address:
                return redirect("/user/"+address)
        return render_template("trade.html")

@app.route('/nfts/<string:address>', methods=['GET'])
def get_acct_nfts(address):
    if request.method == "GET":
        userCreds = json.load(open("./userCredentials.json", "r"))

        raddress = ""
        for creds in userCreds:
            if creds["username"] == address:
                raddress = creds["accountid"]
        accounts = json.load(open("./accounts.json", "r"))
        ownedAcct = accounts[raddress]
        addressToMint = json.load(open("./publickeyToMint.json", "r"))
        mints = addressToMint[ownedAcct]
        mintToUrl = json.load(open("./mintToMetaData.json", "r"))
        acctNfts = {mint: mintToUrl[mint] for mint in mints}

        return jsonify(acctNfts)

@app.route('/nfts/mine', methods=['GET'])
def get_users_nfts():
    if request.method == "GET":
        session = json.load(open("./session.json", "r"))
        raddress = session[request.cookies.get("sessionid")]


        userCreds = json.load(open("./userCredentials.json", "r"))


        accounts = json.load(open("./accounts.json", "r"))
        ownedAcct = accounts[raddress]
        addressToMint = json.load(open("./publickeyToMint.json", "r"))
        mints = addressToMint[ownedAcct]
        mintToUrl = json.load(open("./mintToMetaData.json", "r"))
        acctNfts = {mint: mintToUrl[mint] for mint in mints}

        return jsonify(acctNfts)

@app.route('/user/<string:address>', methods=['GET'])
def user_acct(address):
    if request.method == "GET":
        session = json.load(open("./session.json", "r"))
        try:
            owner = session[request.cookies.get("sessionid")]
            del session

            userCreds = json.load(open("./userCredentials.json", "r"))
            for user in userCreds:
                if user['accountid'] == owner and user['username'] == address:
                    return redirect("/")
        except:
            return render_template("user.html", address=address)
        return render_template("user.html", address=address)

@app.route('/owned', methods=['GET'])
def get_owned_nft():
    if request.method == "GET":
        mintToUrl = json.load(open("./mintToMetaData.json", "r"))
        addressToMint = json.load(open("./publickeyToMint.json", "r"))

        nftPubKeys = []
        PUBLIC_KEY = solana.publickey.PublicKey(request.args['pubkey'])

        addressToMint[request.args['pubkey']] = []
        addresseses = addressToMint[request.args['pubkey']]

        client2  = Client(getSolanaUrl())


        splAccount = solana.rpc.types.TokenAccountOpts(
            program_id=solana.publickey.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"))
        tokens = client2.get_token_accounts_by_owner(PUBLIC_KEY, splAccount)
        tokenPubKeys = [item['pubkey'] for item in tokens['result']['value']]
        for pubkey in tokenPubKeys:
            data = client2.get_token_account_balance(pubkey)
            if data['result']['value']['amount'] == '1' and data['result']['value']['decimals'] == 0:

                mintKey = client2.get_account_info(pubkey, encoding="jsonParsed")['result']['value']['data']['parsed']['info']['mint']
                nft_metadata = BLOCKCHAIN_API_RESOURCE.get_nft_metadata(
                    mint_address=mintKey,
                    network=SolanaNetwork.MAINNET_BETA
                )
                mintToUrl[pubkey] = nft_metadata['data']['uri']
                if pubkey not in addresseses:
                    addresseses.append(pubkey)
                nftPubKeys.append((pubkey, nft_metadata['data']['uri']))
        json.dump(mintToUrl, open("./mintToMetaData.json", "w"))
        json.dump(addressToMint, open("./publickeyToMint.json", "w"))
        return jsonify(nftPubKeys)

@app.route('/pubkey', methods=['POST'])
def get_pubkey():
    if request.method == "POST":
        userKey = request.form['key']
        accounts = json.load(open("./accounts.json", "r"))
        if userKey not in accounts:
            key = solana.keypair.Keypair()
            accounts[userKey] = str(key.public_key)
            with open("./seeds/"+str(key.public_key), "wb") as seedFile:
                seedFile.write(key.seed)
                seedFile.close()
            json.dump(accounts,open("./accounts.json", "w"))

        return str(accounts[userKey])

@app.route('/user/data', methods=['GET'])
def get_user_data():
    if request.method == "GET":
        if request.cookies.get('sessionid') == None:
            return "false"
        session = json.load(open("./session.json", "r"))
        username = session[request.cookies.get("sessionid")]
        return username

@app.route('/', methods=['GET'])
def compare_orders():
    if request.method == "GET":
        if request.cookies.get('sessionid') == None:
            return render_template("index.html")
        session = json.load(open("./session.json", "r"))
        userid = session[request.cookies.get("sessionid")]
        del session
        userCreds = json.load(open("./userCredentials.json", "r"))
        for user in userCreds:
            if user['accountid']  == userid:
                return render_template("home.html", username=user['username'])

app.run(debug=True)