
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
            "offerMessage": ""}
    }

    componentDidMount(){
        var pageaddress = window.location.href.split("/").pop()
        this.setState({"pageAddr": pageaddress})
        this.traderItems(pageaddress)
        var that = this
        $.ajax({
            url: "/user/data",
            success: (result) => {
                if (result != "false"){
                    that.setState({"pubKey": result, "loggedIn": true})
                    that.ownerItems()
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

                Object.keys(result).forEach((item) => {
                    $.ajax({
                        url: result[item],
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
            url: "/nfts/mine",
            success: (result) => {
                //that.setState({"ownerNfts": result})
                let currentNfts = []
                Object.keys(result).forEach((item) => {
                    $.ajax({
                        url: result[item],
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
        $.ajax({
            url: "/trade/confirm",
            method: "post",
            data: {
                "trader": this.state.pageAddr,
                "traderNfts": this.state.traderSelected.join(";"),
                "ownerNfts": this.state.ownerSelected.join(";"),
                "addedSol": "0"
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
    cancelOfferFinal = () => {
        this.setState({"offerMessage": ""})
    }

    tradeOfferSend = () => {
        if (this.state.offerMessage != ""){
            if (this.state.offerMessage == "No items in trade" || this.state.offerMessage == "Offer sent!" || this.state.offerMessage == "Error Sending Offer"){
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

        if (this.state.loggedIn){
            return(
                <div className={"trading-arena"}>
                    <h2>Your Items</h2>
                     <div className={"nft-display"}>
                         {this.state.ownerNfts.map((item, idx) => (
                             <div key={idx} onClick={() => this.ownerSelectNft(item[0])} className={"nft-case "+ownerIsSelected(item[0])}>
                                <p>{item[1].name}</p>
                                <img src={item[1].image} />
                             </div>
                         ))}
                     </div>
                    <h2>{this.state.pageAddr}'s Items</h2>
                    <div className={"nft-display"}>
                         {this.state.traderNfts.map((item, idx) => (
                             <div key={idx}  onClick={() => this.traderSelectNft(item[0])} className={"nft-case "+ traderIsSelected(item[0])}>
                                <p>{item[1].name}</p>
                                <img src={item[1].image} />
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


    render(){

        return(
            <div>
                {this.header()}
                {this.tradeMenu()}
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById("body"))