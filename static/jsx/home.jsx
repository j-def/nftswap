
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
            "loadingCompleted": true,
            "tableHovering": [],
            "tableHoveringRow": "",
            "selectedMetadata": "",
            "notifications": [],
            "renderShow": 0
        }
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
                           updated.push([item[0], result, item[2], item[3]])
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
        if ($("#withdraw-amt-input").val() == "" || $("#withdraw-address-input").val() == ""){
            that.setState({"withdrawSolMessage": "Form incomplete"})
        }

        $.ajax({
            url: "/withdraw/sol",
            method: "post",
            data: {
                "solAmt": $("#withdraw-amt-input").val(),
                "withdrawPubkey": $("#withdraw-address-input").val()
            },
            success: (result) => {
                if (result == "success"){
                    that.setState({"withdrawSolMessage": "Withdraw Successful!"})
                } else{
                    that.setState({"withdrawSolMessage": result})
                }
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
                    <p>{this.state.withdrawSolMessage}</p>
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
                            <div  className={"nft-case"} key={idx}>
                                <div onClick={() => this.openmetadata(item[0])}>
                                <h3>{item[2]}</h3>
                                <p>{item[1].name}</p>
                                <img src={item[1].image} />
                                </div>
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
                        <p>{offer.sol} SOL</p>
                         <div className={"nft-display"}>
                             {Object.keys(offer.senderNfts).map((nft,idx) => {
                                 if (Object.keys(this.state.nftData).includes(nft)) {
                                     return (<div key={idx} className={"nft-case"}>
                                         <p>{this.state.nftData[nft].name}</p>
                                         <img src={this.state.nftData[nft].image}/>
                                     </div>)
                                 }
                             })}
                         </div>
                        <h5>Your Items</h5>
                        <div className={"nft-display"}>
                             {Object.keys(offer.receiverNfts).map((nft, idx) => {
                                 if (Object.keys(this.state.nftData).includes(nft)){
                                      return(<div key={idx} className={"nft-case"}>
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
                             {Object.keys(offer.receiverNfts).map((nft, idx) => {
                                  if (Object.keys(this.state.nftData).includes(nft)) {
                                      return (
                                          <div key={idx} className={"nft-case"}>
                                              <p>{this.state.nftData[nft].name}</p>
                                              <img src={this.state.nftData[nft].image}/>
                                          </div>)
                                  }
                             })}
                         </div>
                        <h5>Their Items</h5>
                        <p>{offer.sol} SOL</p>
                         <div className={"nft-display"}>
                             {Object.keys(offer.senderNfts).map((nft,idx) => {
                                  if (Object.keys(this.state.nftData).includes(nft)) {
                                      return (<div key={idx} className={"nft-case"}>
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

    displayPubKey = (pubkey,idx) => {
        var hovering = ""
        if (this.state.tableHovering.includes(pubkey) && this.state.tableHoveringRow == idx){
             hovering = <p style={{"position": "absolute", "backgroundColor": "#2F3136", "padding": "10px"}}>{pubkey}</p>
        }

        var editList = (pubkey, idnx) => {
            var newlist = this.state.tableHovering
            if (newlist.includes(pubkey)){
                newlist.splice(newlist.indexOf(pubkey), 1)
            } else {
                newlist.push(pubkey)
            }

            this.setState({"tableHovering": newlist, "tableHoveringRow": idnx})
        }

        return(
            <div key={idx}>
                <p onMouseEnter={() => editList(pubkey,idx)} onMouseLeave={() => editList(pubkey,"")}>{pubkey.substring(0, 8)}...</p>
                {hovering}
            </div>
        )
    }

    displaycompletedtrades = () => {
        if (this.state.loadingCompleted){
            return(<div className={"centerized"}>
                <div className="lds-ripple">
                <div></div>
                <div></div>
            </div>
            </div>)
        } else{
            return(
                <div className={"centerized-table"}>
                    <h2>Completed Trades</h2>
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
                                 <td>{this.displayPubKey(item.inputs.sender, idx)}</td>
                                <td>{this.displayPubKey(item.inputs.receiver, idx)}</td>
                                <td>{item.inputs.senderNfts.map((nft, indx) => (
                                  this.displayPubKey(nft, indx+";"+idx)
                                ))}</td>
                                <td>{item.inputs.receiverNfts.map((nft, indx) => (
                                   this.displayPubKey(nft, indx+";"+idx)
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

        footer = () => {
        return(<div style={{"display": "flex", "flexWrap": "no-wrap", "justifyContent": "space-around", "gap": "10px"}}>
                <div>
                    <h4>Developed by CheddaMane#1720</h4>
                </div>
                <div>
                    <h4>Talk to us on <a href={"https://discord.gg/fk8UFWTaGm"}>Discord</a>!</h4>
                </div>
            </div>)
    }

    openmetadata = (metamint) => {
        this.setState({"selectedMetadata": metamint})
    }

    renderMetadata = () => {
        var close = () => {
             this.setState({"selectedMetadata": ""})
        }

        if (this.state.selectedMetadata.length > 0){

            var metadata = ""
            var verified = ""
            var verifiedB = ""
            this.state.depositNfts.forEach((nft) => {
                if (nft[0] == this.state.selectedMetadata ){
                    metadata = nft[1]
                    verified = nft[2]
                    if (verified == "Verified"){
                        verifiedB = nft[3]
                    }
                }
            })

            if (metadata == ""){
                this.setState({"selectedMetadata": ""})
            }

            return(
                <div className={"nft-metadata-case"}>
                    <button onClick={() => close()}>Close</button>
                    <h2>{metadata.name}</h2>
                    <h3>{verified} {verifiedB}</h3>
                    <p>{metadata.description}</p>
                    <img src={metadata.image} />
                        <h3>Attributes</h3>

                    <table>
                        <tbody>
                        {metadata.attributes.map((attribute, idx) => (
                            <tr key={idx}>
                                <td>{attribute.trait_type}</td>
                                <td>{attribute.value}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )
        }

    }


    addNotif = (message) => {
        var currentNotifs = this.state.notifications
        currentNotifs.push(message)
        this.setState({"notifications": currentNotifs})

        setTimeout(() => {
                currentNotifs = this.state.notifications
                currentNotifs.splice(0, 1)
               this.setState({"notifications": currentNotifs})
        }, 5000)

    }

    renderNotifications = () => {

        return(
            <div className={"invisible-notification-bar"}>
                {this.state.notifications.map((notif, idx) => (
                    <div key={idx} id={"notification"+idx} className={"notification"}>
                        <p>{notif}</p>
                    </div>
                ))}
                <button onClick={() => this.addNotif("FUCK")}>Add Notif</button>
            </div>
        )
    }

    updateRenderShow = (renderId) => {
        this.setState({"renderShow": renderId})
    }

    renderSlots = () => {
        var slotData = ""
        var currentSlot = this.state.renderShow
        switch (currentSlot){
            case 0:
                slotData = this.depositNFT()
                break
            case 1:
                slotData = this.tradeOffers()
                break
            case 2:
                slotData = this.displaycompletedtrades()
                break
            case 3:
                slotData = this.displaySettings()
                break
        }

        return(
            <div>
                <div id={"home-buttons"}>
                    <button onClick={() => this.updateRenderShow(0)}>Wallet</button>
                    <button onClick={() => this.updateRenderShow(1)}>Trade Offers</button>
                    <button onClick={() => this.updateRenderShow(2)}>Completed Trades</button>
                    <button onClick={() => this.updateRenderShow(3)}>Settings</button>
                </div>
                {slotData}
            </div>
        )
    }

    displaySettings = () => {

        var saveSettings = () => {

        }


        return(
            <div>
                <h2>Settings</h2>
                <table style={{"marginLeft": "auto", "marginRight": "auto", "textAlign": "center"}}>
                    <tbody>
                    <tr>
                        <td><p>Email</p></td>
                        <td><input id={"email-input"} type={"text"} placeholder={"Email"}/></td>
                    </tr>
                    <tr>
                        <td><p>Save Settings</p></td>
                        <td><button>Save</button></td>
                    </tr>
                    </tbody>
                </table>
            </div>
        )

    }

    render(){
        return(
            <div>
                {this.header()}
                 <h1>{$("#user-username").val()}</h1>
                {this.renderSlots()}
                {this.footer()}
                {this.renderMetadata()}
            </div>
        )
    }
}



ReactDOM.render(<App />, document.getElementById("body"))
