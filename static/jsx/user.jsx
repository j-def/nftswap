
class App extends React.Component{
    constructor(props) {
        super(props);

        this.state = {"pubKey": "", "nfts": [], "loggedIn": false, "logoutButton": false, "loginForm": false, "pageAddr": ""}
    }

    componentDidMount(){
        var pageaddress = window.location.href.split("/").pop()
        this.setState({"pageAddr": pageaddress})
        var that = this
        this.grabOwnedNFTs(pageaddress)
        $.ajax({
            url: "/user/data",
            success: (result) => {
                if (result != "false"){
                    that.setState({"pubKey": result, "loggedIn": true})
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

    toBrowse = () => {
        window.location.href = "/browse"
    }

    toHome = () => {
        window.location.href = "/"
    }

    userLogoutForm = () => {

        if (this.state.logoutButton == true){
            return(
                <button onClick={() => this.logout()} className={"logout-button"}>Logout</button>
            )
        }

    }


    header = () => {
        if (this.state.loggedIn){
            return(
                <div id="header">
                    <div id={"header-left"}>
                         <div onClick={() => this.toHome()} className={"logo"}>
                            <img src={"/static/images/logo.png"} />
                        </div>


                    </div>

                    <div id={"header-right"}>


                        <div onClick={() => this.toBrowse()} className={"login-button"}>
                            <p>Browse</p>
                        </div>
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
                         <div className={"logo"}>
                            <img src={"/static/images/logo.png"} />
                        </div>


                    </div>
                     <div id={"header-right"}>
                          <div onClick={() => this.toHome()} className={"login-button"}>
                             <p>Browser</p>
                        </div>
                    <div onClick={() => this.userLoginToggle()} className={"login-button"} id={"phantom-login"}>
                        <p>Login</p>
                    </div>
                     {this.userLoginForm()}
                     </div>
                 </div>
            )
        }




    }




    grabOwnedNFTs = (pageaddr) => {
        var that = this
        let currentNfts = []
        $.ajax({
            url: "/nfts/"+pageaddr,
            method: "get",
            success: (result) => {
                Object.keys(result).forEach((item) => {
                    $.ajax({
                        url: result[item],
                        success: (result) => {
                            currentNfts.push([item, result])
                            that.setState({"nfts": currentNfts})
                        }
                    })
                })

            }
        })
    }

    toTradeMenu = () => {
        window.location.href = "/trade/"+this.state.pageAddr
    }

    displayNfts = () => {

        var tradeButton = () => {
            if (this.state.loggedIn == true){
                return(<button onClick={() => this.toTradeMenu()} className={"open-trade"}>Create Trade</button>)
            }
        }

        return(
            <div id={"user-data-display"}>
                <h1>User Wallet</h1>
                {tradeButton()}
                 <div className={"nft-display"}>
                     {this.state.nfts.map((item, idx) => (
                         <div key={idx} className={"nft-case"}>
                            <p>{item[1].name}</p>
                            <img src={item[1].image} />
                         </div>
                     ))}
                 </div>
            </div>

        )
    }

    render(){

        return(
            <div>
                {this.header()}
                {this.displayNfts()}
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById("body"))