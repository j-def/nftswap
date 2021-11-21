
class App extends React.Component{
    constructor(props) {
        super(props);
        this.state = {
            "loginForm": false,
            "accountCreateMessage": "",
            "accountLoginMessage": "",
            "signupForm": false,
            "tempUser": "",
            "tempPass": "",
            "accountCreateMessage": "",
            "expandedFAQs": [],
        }
    }

    grabnfts =  (publicKey) => {
        var that = this
        this.setState({"nfts": []})
        let connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('mainnet-beta'), 'confirmed');
        let owner  = new solanaWeb3.PublicKey(publicKey.toString())
        let tokenOwner  = new solanaWeb3.PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA".toString())
        let filter = {programId : tokenOwner}

        connection.getTokenAccountsByOwner(owner, filter).then((result) => {
            console.log(result)
            result.value.forEach((item) => {
                let tokenID  = new solanaWeb3.PublicKey(item.pubkey.toString())

                connection.getTokenAccountBalance(tokenID).then(item => {
                    if (item.value.amount == 1 && item.value.decimals == 0){

                        connection.getAccountInfo(tokenID).then(results => {

                            metaplex.Metadata.getPDA(metaplex.deserialize(results.data).mint).then(result => {

                                metaplex.Metadata.load(connection, result).then(result => {

                                    let tempList = that.state.nfts
                                        $.ajax({
                                            url: result.data.data.uri,
                                            method: "get",
                                            success: (result) => {
                                                console.log(metaplex.deserialize(results.data).mint)
                                                tempList.push([metaplex.deserialize(results.data).mint, result])
                                                that.setState({"nfts": tempList})
                                         }
                                    })

                                })
                            })
                        })
                    }
                })
            })
        })
    }



    userloginpost = () => {
        var that = this
        $.ajax({
            url: "/login",
            method: "post",
            data: {
                "username": $("#username-input").val(),
                "password": $("#password-input").val()
            },
            success: (result) => {
                if (result.status == "success"){
                    window.location.href = "/"
                } else{
                    that.setState({"accountLoginMessage": result})
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
            this.setState({"loginForm": newState, "signupForm": false})
    }

    displayLoginMessage = () => {
         if (this.state.accountLoginMessage != ""){
            return(
                <p>{this.state.accountLoginMessage}</p>
            )
        }
    }

    userLoginForm = () => {

        if (this.state.loginForm == true){
            return(
                <div className={"user-login_box"}>
                    <h4>Login</h4>
                    <input type={"text"} id={"username-input"} placeholder={"Username"} /> <br />
                    <input type={"password"} id={"password-input"} placeholder={"Password"}/> <br/>
                    <button onClick={() => {this.userloginpost()}}>Login</button>
                    {this.displayLoginMessage()}
                </div>
            )
        }

    }

    userSignUpToggle = () => {
            var newState = this.state.signupForm
            if (newState == false){
                newState = true
            } else{
                newState = false
            }
            this.setState({"signupForm": newState, "loginForm": false})
    }

     userSignUpForm = () => {

        if (this.state.signupForm == true){
            return(this.createAccount())
        }

    }

    toBrowser = () => {
        window.location.href = "/browse"
    }

    toCreate = () => {
        window.location.href = "#account-create"
    }

    toHome = () => {
        window.location.href = "/"
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
                    <div onClick={() => this.toBrowser()} className={"login-button"} >
                        <p>Browse</p>
                    </div>
                     <div onClick={() => this.userSignUpToggle()} className={"login-button"} >
                        <p>Create Account</p>
                    </div>
                         {this.userSignUpForm()}
                    <div onClick={() => this.userLoginToggle()} className={"login-button"} id={"phantom-login"}>
                        <p>Login</p>
                    </div>
                     {this.userLoginForm()}
                     </div>
                 </div>
            )


    }

    accountCreatePost = () => {
        var that = this
        $.ajax({
            url: "/accountcreation",
            data: {
                "username": $("#new-username-input").val(),
                "password": $("#new-password-input").val()
            },
            method: "post",
            success: (result) => {
                if (result == "created"){
                    that.setState({"accountCreateMessage": "Success! Login now"})
                } else{
                    that.setState({"accountCreateMessage": result})
                }
            }
        })
    }

    displayCreationMessage = () => {
        if (this.state.accountCreateMessage != ""){
            return(
                <p>{this.state.accountCreateMessage}</p>
            )
        }
    }

    createAccount = () => {
        var username = this.state.tempUser
        var password = this.state.tempPass
        var usernameNotice = ""
        var passwordNotice = ""
        if (username.length < 4 && username.length > 0){
                usernameNotice = <p>Must be at least 4 characters</p>
            }
        if (password.length < 4 && password.length > 0){
                passwordNotice = <p>Must be at least 8 characters</p>
            }

        var editUser = (e) => {
            this.setState({"tempUser": e.target.value})

        }
        var editPass = (e) => {
            this.setState({"tempPass": e.target.value})

        }

        return(
            <div style={{"textAlign": "center" }} id={"account-create"}>
                <h4>Create Account</h4>
                <input type={"text"} onChange={(e) => editUser(e)} placeholder={"Username"} id={"new-username-input"} />
                {usernameNotice}
                <br />
                <input type={"password"} onChange={(e) => editPass(e)} placeholder={"Password"} id={"new-password-input"} />
                {passwordNotice}
                <br />

                <button onClick={() => this.accountCreatePost()}>Create</button>
                {this.displayCreationMessage()}
            </div>
        )
    }

    welcome = () =>  {
        return(
            <div>

            </div>
        )
    }

    welcome2 = () => {
        return(
            <div>
                <div className={"welcome-cover"}>
                    <h1>Welcome to NFTeSWAP <i>beta</i></h1>
                </div>
                <div className={"nested left-opener"}>
                    <div>
                         <img src={"/static/images/nftswap.png"} />
                    </div>
                    <div>
                        <h2 className={"font-1"}>Join the #1 Solana NFT Trading Platform</h2>
                        <br />
                        <h2  className={"font-2"}>Trade Safely and Securely From Anywhere in the World</h2>
                    </div>
                </div>
                <div className={"nested right-opener"}>
                    <div>
                        <h2 className={"font-1"}>Start Trading on Solana's Safest NFT Swap!</h2>
                        <h3 className={"font-2"}>How it works</h3>
                <h4 className={"font-2b"}>1. Create an account</h4>
                <h4 className={"font-2b"}>2. Deposit your Solana Based NFT's</h4>
                <h4 className={"font-2b"}>3. Send or Receive a Trade Offer!</h4>
                <h4 className={"font-2b"}>4. Complete a Trade and Withdraw your new NFT's and SOL</h4>
                    </div>
                    <div>
                         <img src={"/static/images/nftchain.png"} />
                    </div>
                </div>
            </div>
        )
    }

    contactUs = () => {
        return(
            <div style={{"display": "flex", "flexWrap": "no-wrap", "justifyContent": "space-around", "gap": "10px"}}>
                <div>
                    <h4>Developed by CheddaMane#1720</h4>
                </div>
                <div>
                    <h4>Talk to us on <a href={"https://discord.gg/fk8UFWTaGm"}>Discord</a>!</h4>
                </div>
            </div>
        )
    }

    footer = () => {
        return(
            <div>
                <h4>Developed by CheddaMane#1720</h4>
            </div>
        )
    }

    faq = () => {

        const faqMessages = ["There are no fees currently!"]


        var faqAnswerDisplay = (idx) => {
                if (this.state.expandedFAQs.includes(idx)){
                    return(
                        <p>{faqMessages[idx]}</p>
                    )
            }
        }

        var expandFAQ = (idx) => {
            let expanded = this.state.expandedFAQs
            if (expanded.includes(idx)){
                expanded.splice(expanded.indexOf(idx), 1)
                this.setState({"expandedFAQs": expanded})
            } else{
                expanded.push(idx)
                this.setState({"expandedFAQs": expanded})
            }
        }


        return(
            <div className={"faq-container"}>
                <h2>F.A.Q.</h2>
                <div onClick={() => expandFAQ(0)} className={"faq-box"}>
                    <div>
                        <p>What is the fee?</p>
                        {faqAnswerDisplay(0)}
                    </div>

                    <img  src={"/static/images/up-arrow.svg"} />

                </div>

            </div>
        )
    }


    render(){
        return(
            <div>
                {this.header()}
                {this.welcome2()}
                {this.faq()}
                {this.contactUs()}
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById("body"))