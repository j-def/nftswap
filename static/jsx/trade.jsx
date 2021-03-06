
class App extends React.Component{
    constructor(props) {
        super(props);

        this.state = {"pubKey": "",
            "pageAddr": "",
            "traderNfts": [],
            "ownerNfts": [],
            "loggedIn": false,
            "logoutButton": false,
            "loginForm": false,
            "ownerSelected": [],
            "traderSelected": [],
            "offerMessage": "",
            "pubkeyBalance": "0",
            "selectedMetadata": "",
            "recverification": {}}
    }

    componentDidMount(){
        var pageaddress = window.location.href.split("/").pop()
        this.setState({"pageAddr": pageaddress})
        this.traderItems(pageaddress)
        var that = this
        $.ajax({
            url: "/user/pub",
            success: (result) => {
                if (result != "false"){
                    that.setState({"pubKey": result, "loggedIn": true})
                    that.ownerItems()
                    that.pubkeywalletValue()
                }
            }
        })
    }

    userloginpost = () => {
        $.ajax({
            url: "/login",
            method: "post",
            data: {
                "username": $("#username-input").val(),
                "password": $("#password-input").val()
            },
            success: (result) => {
                if (result.status == "success"){
                    window.location.reload()
                }
            }
        })
    }

    userLoginToggle = () => {
            var newState = this.state.loginForm
            if (newState == false){
                newState = true
            } else{
                newState = false
            }
            this.setState({"loginForm": newState})
    }

    userLoginForm = () => {

        if (this.state.loginForm == true){
            return(
                <div className={"user-login_box"}>
                    <input type={"text"} id={"username-input"} placeholder={"Username"} /> <br />
                    <input type={"password"} id={"password-input"} placeholder={"Password"}/> <br/>
                    <button onClick={() => {this.userloginpost()}}>Login</button>
                </div>
            )
        }

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

    userLogoutForm = () => {

        if (this.state.logoutButton == true){
            return(
                <button onClick={() => this.logout()}>Logout</button>
            )
        }

    }

    goHome = () => {
        window.location.href ="/"
    }

    header = () => {
        if (this.state.loggedIn){
            return(
                <div id="header">
                    <div id={"header-left"}>
                        <div onClick={() => this.goHome()} className={"logo"}>
                            <img src={"/static/images/logo.png"} />
                        </div>
                    </div>

                    <div id={"header-right"}>
                    <div onClick={() => this.userLogoutToggle()} className={"login-button"}>
                        <p>Logged In</p>
                    </div>
                    {this.userLogoutForm()}
                    </div>
                </div>
            )
        } else{
            return(
                 <div id="header">
                      <div id={"header-left"}>
                        <div onClick={() => this.goHome()} className={"logo"}>
                            <img src={"/static/images/logo.png"} />
                        </div>
                    </div>

                    <div onClick={() => this.userLoginToggle()} className={"login-button"} id={"phantom-login"}>
                        <p>Login</p>
                    </div>
                     {this.userLoginForm()}
                 </div>
            )
        }
    }

    traderItems = (pageAddre) => {
       var that = this
        $.ajax({
            url: "/nfts/"+pageAddre,
            success: (result) => {
                //that.setState({"ownerNfts": result})
                let currentNfts = []
                console.log(result)
                that.setState({"recverification": result.nftverification})

                Object.keys(result.nfts).forEach((item) => {

                    $.ajax({
                        url: result.nfts[item],
                        success: (results) => {

                            currentNfts.push([item, results])
                            that.setState({"traderNfts": currentNfts})
                        }
                    })
                })

            }
        })
    }

    ownerItems = () => {
        var that = this


        $.ajax({
            url: "/nfts/s/mine",
            success: (result) => {
                let currentNfts = []
                that.setState({"sendverification": result.nftverification})
                Object.keys(result.nfts).forEach((item) => {
                    $.ajax({
                        url: result.nfts[item],
                        success: (results) => {
                            currentNfts.push([item, results])
                            that.setState({"ownerNfts": currentNfts})
                        }
                    })
                })

            }
        })
    }

    ownerSelectNft = (mint) => {
        let currentNfts = this.state.ownerSelected
        if (currentNfts.includes(mint)){
            currentNfts.splice(currentNfts.indexOf(mint), 1)
        } else {
            currentNfts.push(mint)
        }
        this.setState({"ownerSelected": currentNfts})
    }

    traderSelectNft = (mint) => {
        let currentNfts = this.state.traderSelected
        if (currentNfts.includes(mint) == true){
            currentNfts.splice(currentNfts.indexOf(mint), 1)
        } else {
            currentNfts.push(mint)
        }
        this.setState({"traderSelected": currentNfts})
    }

    makeTrade = () => {
        if (this.state.ownerSelected.length == 0 && this.state.traderSelected.length == 0){
            this.setState({"offerMessage": "No items in trade"})
        } else if (this.state.ownerSelected.length == 0 || this.state.traderSelected.length == 0){
            this.setState({"offerMessage": "This trade is a gift. Are you sure?"})
        } else {
            this.setState({"offerMessage": "Ready to send?"})
        }

        console.log(this.state.ownerSelected, this.state.traderSelected)
    }

    sendOfferFinal = () => {
        var that = this

        if ($("#sol-input").val() >= parseFloat(this.state.pubkeyBalance) - 0.001){
            this.setState({"offerMessage": "Insufficient funds."})
        } else {
            $.ajax({
            url: "/trade/confirm",
            method: "post",
            data: {
                "trader": this.state.pageAddr,
                "traderNfts": this.state.traderSelected.join(";"),
                "ownerNfts": this.state.ownerSelected.join(";"),
                "addedSol": $("#sol-input").val()
            },
            success: (result) => {
                console.log(result)
                if (result == "success"){
                    that.setState({"offerMessage": "Offer sent!"})
                } else{
                    that.setState({"offerMessage": "Error Sending Offer"})
                }
            }
        })
        }

    }
    cancelOfferFinal = () => {
        this.setState({"offerMessage": ""})
    }

    tradeOfferSend = () => {
        if (this.state.offerMessage != ""){
            if (this.state.offerMessage == "No items in trade" || this.state.offerMessage == "Offer sent!" || this.state.offerMessage == "Error Sending Offer" || this.state.offerMessage == "Insufficient funds." ){
                return(
                 <div>
                     <p>{this.state.offerMessage}</p>
                 </div>
             )
            } else{
                return(
                    <div>
                         <p>{this.state.offerMessage}</p>
                        <div style={{"marginLeft": "50%", "transform": "translateX(-50%)", "width": "fit-content"}}>
                            <button onClick={() => this.sendOfferFinal()}>Send</button>
                            <button onClick={() => this.cancelOfferFinal()}>Cancel</button>
                        </div>

                     </div>
                )
            }

        }

    }

    pubkeywalletValue = () => {
        var that = this
        var connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');
        var pubKeyString = this.state.pubKey.toString()
        if (pubKeyString != ""){
            let tokenID = new solanaWeb3.PublicKey(pubKeyString)
            connection.getBalance(tokenID).then(result => {
                that.setState({"pubkeyBalance": (result / 1000000000).toFixed(3)})
            })

        }

    }

    addSol = () => {
        var noNegativeValues = (e) => {
            if (e.target.value < 0){
                $("#sol-input").val(0)
            } else if (e.target.value.length == 0){
                $("#sol-input").val(0)
            }

        }

        return(
            <div className={"add-sol"}>
                <input id={"sol-input"} onChange={(e) => noNegativeValues(e)} defaultValue={0} type={"number"} />
                <p>Of Maximum {this.state.pubkeyBalance}</p>
            </div>
            )

    }

    tradeMenu = () => {
        var traderIsSelected = (mint) => {
            if (this.state.traderSelected.includes(mint)){
                return("selected")
            }
        }
        var ownerIsSelected = (mint) => {
            if (this.state.ownerSelected.includes(mint)){
                return("selected")
            }
        }

        var empty1 = ""
        if (this.state.ownerNfts.length == 0){
            empty1 = <h3>No Items</h3>
        }

        var empty2 = ""
        if (this.state.traderNfts.length == 0){
            empty2 = <h3>No Items</h3>
        }

        if (this.state.loggedIn){
            return(
                <div className={"trading-arena"}>
                    <h2>Your Items</h2>
                     <div className={"nft-display"}>
                         {empty1}
                         {this.state.ownerNfts.map((item, idx) => (
                             <div key={idx} onClick={() => this.ownerSelectNft(item[0])} className={"nft-case "+ownerIsSelected(item[0])}>
                                 <h3>{this.state.sendverification[item[0]][0]}</h3>
                                 <p>{item[1].name}</p>
                                <img src={item[1].image} />
                                <button onClick={() => this.openmetadata(item[0])} className={"metadata"}>View Metadata</button>
                             </div>
                         ))}
                     </div>
                    <h3>Add SOL</h3>
                    {this.addSol()}
                    <h2>{this.state.pageAddr}'s Items</h2>
                    <div className={"nft-display"}>
                        {empty2}
                         {this.state.traderNfts.map((item, idx) => (
                             <div key={idx}  onClick={() => this.traderSelectNft(item[0])} className={"nft-case "+ traderIsSelected(item[0])}>
                                <h3>{this.state.recverification[item[0]][0]}</h3>
                                 <p>{item[1].name}</p>
                                <img src={item[1].image} />
                                <button onClick={() => this.openmetadata(item[0])} className={"metadata"}>View Metadata</button>
                             </div>
                         ))}
                     </div>
                    {this.tradeOfferSend()}
                    <button className={"trade-button"} onClick={() => this.makeTrade()}>Send Trade Offer</button>
                </div>
            )
        } else{
            return(
                <div className={"trading-arena"}>
                    <p>Please Login</p>
                </div>
            )
        }


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
            this.state.traderNfts.forEach((nft) => {
                if (nft[0] == this.state.selectedMetadata ){
                    metadata = nft[1]
                }
            })
            this.state.ownerNfts.forEach((nft) => {
                if (nft[0] == this.state.selectedMetadata ){
                    metadata = nft[1]
                }
            })

            if (metadata == ""){
                this.setState({"selectedMetadata": ""})
            }

            var verified = ""
            var verifiedB = ""
            var verification = []
            if (Object.keys(this.state.sendverification).includes(this.state.selectedMetadata)){
                verification = this.state.sendverification[this.state.selectedMetadata]
                verified = verification[0]
                verifiedB = verification[1]
            }

            if (Object.keys(this.state.recverification).includes(this.state.selectedMetadata)){
                verification = this.state.recverification[this.state.selectedMetadata]
                verified = verification[0]
                verifiedB = verification[1]
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
                            <tr>
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


    render(){

        return(
            <div>
                {this.header()}
                {this.tradeMenu()}
                {this.renderMetadata()}
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById("body"))