
class App extends React.Component{
    constructor(props) {
        super(props);
        this.state = {"loginForm": false, "accountCreateMessage": ""}
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

    toBrowser = () => {
        window.location.href = "/browse"
    }


    header = () => {

            return(
                 <div id="header">
                     <div id={"header-left"}>
                         <div className={"logo"}>
                            <img src={"/static/images/logo.png"} />
                        </div>
                        <h1>NFTySWAP</h1>

                    </div>
                     <div id={"header-right"}>
                    <div onClick={() => this.toBrowser()} className={"login-button"} >
                        <p>Browse</p>
                    </div>
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
        return(
            <div style={{"textAlign": "center" }}>
                <h2>Create Account</h2>
                <input type={"text"} placeholder={"Username"} id={"new-username-input"} />
                <br />
                <input type={"password"} placeholder={"Password"} id={"new-password-input"} />
                <br />

                <button onClick={() => this.accountCreatePost()}>Create</button>
                {this.displayCreationMessage()}
            </div>
        )
    }

    welcome = () =>  {
        return(
            <div>
                <h1>Welcome to NFTySWAP</h1>
                <h2>The ultimate Solana NFT p2p Swap!</h2>
                <h3>How it works</h3>
                <h4>1. Create an account</h4>
                <h4>2. Deposit your Solana Based NFT's</h4>
                <h4>3. Send or Receive a Trade Offer!</h4>
                <h4>4. Complete a Trade and Withdraw your new NFT's and SOL</h4>
            </div>
        )
    }




    render(){
        return(
            <div>
                {this.header()}
                {this.createAccount()}
                {this.welcome()}
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById("body"))