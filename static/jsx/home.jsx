
class App extends React.Component{
    constructor(props) {
        super(props);
        this.state = {"pubKey": "",
            "depositPubKey": "",
            "depositNfts": [],
            "depositBalance": 0,
            "logoutButton": false,
            "trades": [],
            "nftData": {},
            "ready": false,
            "withdrawMenuList": [],
            "withdrawMessages": {},
            "solWithdrawMenu": false,
            "withdrawSolMessage": "",
            "loadingNFT": true,
            "loadingTrades": true,
            "completedTrades": [],
            "loadingCompleted": true}
    }

    componentDidMount(){
        var that = this
        $.ajax({
            url: "/user/data",
            success: (result) => {
                that.setState({"pubKey": result})
                that.grabPubKey()
                that.getTrades()
                that.updateCompletedtrades()
            }
        })
    }

    grabPubKey = () => {
        var that = this
        $.ajax({
            url: "/pubkey",
            method: "post",
            data: {
                "key": this.state.pubKey
            },
            success: (result) => {
                that.setState({"depositPubKey": result})
                that.grabOwnedNFTs()
                that.pubkeywalletValue()

            }
        })
    }





    userLogoutToggle = () => {
            var newState = this.state.logoutButton
            if (newState == false){
                newState = true
            } else{
                newState = false
            }
            this.setState({"logoutButton": newState})
    }

    logout = () => {
        window.location.href = "/logout"
    }
    toBrowser = () => {
        window.location.href = "/browse"
    }

    userLoginForm = () => {

        if (this.state.logoutButton == true){
            return(
                <button onClick={() => this.logout()} className={"logout-button"}>Logout</button>
            )
        }

    }


    header = () => {

            return(

                <div id="header">
                    <div id={"header-left"}>
                         <div className={"logo"}>
                            <img src={"/static/images/logo.png"} />
                        </div>


                    </div>

                    <div id={"header-right"}>
                         <div onClick={() => this.toBrowser()} className={"login-button"}>
                             <p>Browser</p>
                        </div>
                        <div onClick={() => this.userLogoutToggle()} className={"login-button"}>
                            <p>Logged In</p>
                        </div>
                        {this.userLoginForm()}
                    </div>

                </div>
            )

    }

    nftLoading = () => {
        if (this.state.loadingNFT){
            return(<div className="lds-ripple">
                <div></div>
                <div></div>
            </div>)
        }
    }


    grabOwnedNFTs = () => {
        var that = this
        that.setState({"depositNfts": [], "loadingNFT": true})
        $.ajax({
            url: "/owned",
            method: "get",
            data: {
                "pubkey": this.state.depositPubKey
            },
            success: (result) => {
              that.setState({ "loadingNFT": false})
                var updated = []

               result.forEach((item) => {
                   $.ajax({
                       url: item[1],
                       success: (result) => {
                           updated.push([item[0], result])
                           that.setState({"depositNfts": updated})
                       }
                   })
               })




            }
        })
    }


    pubkeywalletValue = () => {
        var that = this
        var connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');
        var pubKeyString = this.state.depositPubKey.toString()
        if (pubKeyString != ""){
            let tokenID = new solanaWeb3.PublicKey(pubKeyString)
            connection.getBalance(tokenID).then(result => {
                that.setState({"depositBalance": (result / 1000000000).toFixed(3)})
            })

        }

    }

    refreshDepositWallet = () => {
        this.grabOwnedNFTs()
        this.pubkeywalletValue()
    }

    toggleWithdrawMenu = (mint) => {
        let currentMenuList = this.state.withdrawMenuList
        if (currentMenuList.includes(mint)){
            currentMenuList.splice(currentMenuList.indexOf(mint), 1)
        } else{
            currentMenuList.push(mint)
        }
        this.setState({"withdrawMenuList": currentMenuList})
    }

    withdrawSubmit = (mint) => {
        var that = this
        $.ajax({
            url: "/withdraw",
            method: "post",
            data: {
                "mint": mint,
                "withdrawPubkey": $("#withdraw-address-input").val()
            },
            success: (result) => {
                if (result == "success"){
                    let withdrawMintMessage = that.state.withdrawMessages
                    withdrawMintMessage[mint] = "NFT Withdrawn!"
                    that.setState({"withdrawMessages": withdrawMintMessage})
                }
            }
        })
    }

    withdrawMenu = (mint) => {
        if (this.state.withdrawMenuList.includes(mint)){
            return(
                <div>
                    <input type={"text"} placeholder={"Withdraw Address"} id={"withdraw-address-input"}/>
                    <button onClick={() => this.withdrawSubmit(mint)}>Submit</button>
                </div>
            )
        }

    }

    withdrawMessage = (mint) => {
        if (Object.keys(this.state.withdrawMessages).includes(mint)){
            return(this.state.withdrawMessages[mint])
        }
    }

    withdrawSol = () => {
        var that = this
        console.log($("#withdraw-address-input").val(), $("#withdraw-amt-input").val())
        $.ajax({
            url: "/withdraw/sol",
            method: "post",
            data: {
                "solAmt": $("#withdraw-amt-input").val(),
                "withdrawPubkey": $("#withdraw-address-input").val()
            },
            success: (result) => {
                console.log(result)
            }
        })
    }

    withdrawSolMenuToggle = () => {
        if (this.state.solWithdrawMenu){
            this.setState({"solWithdrawMenu": false})
        } else{
            this.setState({"solWithdrawMenu": true})
        }
    }


    withdrawSolMenu = () => {
        var verifyAmt = (e) => {
            console.log(e.target.value)
            if (e.target.value < 0){
                $("#withdraw-amt-input").val(Math.abs(e.target.value))
            }

        }

        if (this.state.solWithdrawMenu){
            return(
                <div className={"sol-withdraw"}>
                    <h3>Withdraw SOL</h3>
                    <input type={"number"} onChange={(e) => verifyAmt(e)} id={"withdraw-amt-input"} placeholder={"Withdraw Amount"}/>
                    <input type={"text"} id={"withdraw-address-input"}  placeholder={"Withdraw Address"}/>
                    <button onClick={() => this.withdrawSol()}>Confirm Withdraw</button>
                </div>
            )
        }
    }

    copyPubkey = () => {
        console.log(this.state.depositPubKey)
            navigator.clipboard.writeText(this.state.depositPubKey);
    }



    depositNFT = () => {
        if (this.state.pubKey != ""){
               return(
                <div id={"deposit-display"}>
                    <h2>Your Trading Address</h2>
                    <button className={"refresh-nfts"} onClick={() => this.refreshDepositWallet()}>Refresh</button>
                    <p>Send NFT's to <b>{this.state.depositPubKey}</b></p>
                    <button onClick={() => this.copyPubkey()}>Copy Public Key</button>
                    <p>Wallet Balance: <b>{this.state.depositBalance}</b></p>
                    <button onClick={() => this.withdrawSolMenuToggle()}>Withdraw SOL</button>
                    {this.withdrawSolMenu()}
                    <div className={"nft-display"}>
                        {this.nftLoading()}
                        {this.state.depositNfts.map((item, idx) => (
                            <div className={"nft-case"} key={idx}>
                                <p>{item[1].name}</p>
                                <img src={item[1].image} />
                                <button onClick={() => this.toggleWithdrawMenu(item[0])}>Withdraw</button>
                                {this.withdrawMenu(item[0])}
                                <p>{this.withdrawMessage(item[0])}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )
        }

    }

    getTrades =  () => {
        var that = this
        this.setState({"loadingTrades": true})
        $.ajax({
            url: "/trades/mine",
            success: (result) => {
                that.setState({"loadingTrades": false})
                console.log(this.state.loadingTrades)
                var nftData = {}
                result.forEach(trade => {
                    Object.keys(trade.receiverNfts).forEach(recNft => {
                        let mint = recNft
                        let metadataUri = trade.receiverNfts[recNft]
                        $.ajax({
                            url: metadataUri,
                            success: (metadataResult) => {
                                nftData[mint] = metadataResult
                                that.setState({"nftData": nftData})
                            }
                        })
                    })

                    Object.keys(trade.senderNfts).forEach(sendNft => {
                        let mint = sendNft
                        let metadataUri = trade.senderNfts[sendNft]
                        $.ajax({
                            url: metadataUri,
                            success: (metadataResult) => {
                                nftData[mint] = metadataResult
                                that.setState({"nftData": nftData})
                            }
                        })
                    })
                })
                that.setState({"trades": result})

            }
        })
    }

    acceptOffer = (offerId) => {
        var that = this
        $.ajax({
            url: "/trade/accept",
            method: "post",
            data: {
                "offerid": offerId
            },
            success: (result) => {
                if (result == "success"){
                    that.getTrades()
                } else {
                    alert(result)
                }
            }
        })
    }

    cancelOffer = (offerId) => {
        var that = this
        $.ajax({
            url: "/trade/cancel",
            method: "post",
            data: {
                "offerid": offerId
            },
            success: (result) => {
                if (result == "success"){
                    that.getTrades()
                } else {
                    alert(result)
                }
            }
        })
    }

    loadingOrNone = () => {
        if (this.state.loadingTrades){
            return(<div className="lds-ripple">
                <div></div>
                <div></div>
            </div>)
        }
    }

    tradeOffers = () => {
        var sentOffers = this.state.trades.filter(trade => trade.role == "sender")
        var receivedOffers = this.state.trades.filter(trade => trade.role == "receiver")
        var sentOfferMessage = ""
        if (sentOffers.length == 0 && this.state.loadingTrades == false){
            sentOfferMessage = <h4>No Sent Offers</h4>
        }
        var receivedOfferMessage = ""
        if (receivedOffers.length == 0 && this.state.loadingTrades == false){
            receivedOfferMessage = <h4>No Receive Offers</h4>
        }
        return(
            <div>
                <h2>Your Trade Offers</h2>
                <div style={{"width": "fit-content", "marginLeft": "auto", "marginRight": "auto"}} >
                    {this.loadingOrNone()}
                </div>

                <h3>Sent</h3>
                {sentOfferMessage}
                {sentOffers.map((offer, idx) => (
                    <div className={"trade"} key={idx}>
                        <h4>Offer to {offer.receiverUser}</h4>
                        <h5>Your Items</h5>
                         <div className={"nft-display"}>
                             {Object.keys(offer.senderNfts).map((nft) => {
                                 if (Object.keys(this.state.nftData).includes(nft)) {
                                     return (<div className={"nft-case"}>
                                         <p>{this.state.nftData[nft].name}</p>
                                         <img src={this.state.nftData[nft].image}/>
                                     </div>)
                                 }
                             })}
                         </div>
                        <h5>Your Items</h5>
                        <div className={"nft-display"}>
                             {Object.keys(offer.receiverNfts).map((nft) => {
                                 if (Object.keys(this.state.nftData).includes(nft)){
                                      return(<div className={"nft-case"}>
                                             <p>{this.state.nftData[nft].name}</p>
                                             <img src={this.state.nftData[nft].image}/>
                                         </div>)
                                 }

                             })}
                         </div>
                        <button onClick={() => this.cancelOffer(offer.offer)}>Cancel</button>
                    </div>
                ))}
                <h3>Received</h3>
                {receivedOfferMessage}
                {receivedOffers.map((offer, idx) => (
                    <div className={"trade"} key={idx}>
                        <h4>Offer from {offer.senderUser}</h4>
                        <h5>Your Items</h5>
                         <div className={"nft-display"}>
                             {Object.keys(offer.receiverNfts).map((nft) => {
                                  if (Object.keys(this.state.nftData).includes(nft)) {
                                      return (
                                          <div className={"nft-case"}>
                                              <p>{this.state.nftData[nft].name}</p>
                                              <img src={this.state.nftData[nft].image}/>
                                          </div>)
                                  }
                             })}
                         </div>
                        <h5>Their Items</h5>
                         <div className={"nft-display"}>
                             {Object.keys(offer.senderNfts).map((nft) => {
                                  if (Object.keys(this.state.nftData).includes(nft)) {
                                      return (<div className={"nft-case"}>
                                          <p>{this.state.nftData[nft].name}</p>
                                          <img src={this.state.nftData[nft].image}/>
                                      </div>)
                                  }

                             })}
                         </div>
                        <button onClick={() => this.acceptOffer(offer.offer)}>Accept</button>
                        <button onClick={() => this.cancelOffer(offer.offer)}>Cancel</button>
                    </div>
                ))}
            </div>
        )
    }

    updateCompletedtrades = () => {
        var that = this
        $.ajax({
            url: "/trades/completed",
            success: (result) => {
            that.setState({"completedTrades": result, "loadingCompleted": false})
        }
        })
    }

    displaycompletedtrades = () => {

        if (this.state.loadingCompleted){
            return(<div className="lds-ripple">
                <div></div>
                <div></div>
            </div>)
        } else{
            return(
                <div>
                    <table>
                        <thead>
                            <tr>
                                <td>ID</td>
                                <td>Sender</td>
                                <td>Receiver</td>
                                <td>Sender Mints</td>
                                <td>Receiver Mints</td>
                                <td>SOL</td>
                            </tr>
                        </thead>
                    <tbody>
                          {this.state.completedTrades.map((item, idx) => (
                            <tr key={idx}>
                                <td>{item.id}</td>
                                 <td>{item.inputs.sender}</td>
                                <td>{item.inputs.receiver}</td>
                                <td>{item.inputs.senderNFTs.map((nft,indx) => (
                                    <span key={indx}>{nft}</span>
                                ))}</td>
                                <td>{item.inputs.receiverNfts.map((nft,indx) => (
                                    <span key={indx}>{nft}</span>
                                ))}</td>
                                <td>{item.inputs.sol}</td>
                            </tr>
                        ))}
                    </tbody>

                    </table>
                </div>
            )
        }

    }


    render(){
        return(
            <div>
                {this.header()}
                 <h1>{$("#user-username").val()}</h1>
                {this.depositNFT()}
                {this.tradeOffers()}
                
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById("body"))
