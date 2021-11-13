
class App extends React.Component{
    constructor(props) {
        super(props);

        this.state = {"pubKey": "",
            "loggedIn": false,
            "logoutButton": false,
            "loginForm": false,
            "availableUsers": [],
            "metadata": {},
            "users": []
        }
    }

    componentDidMount(){
        var that = this
        this.getUsersItems()
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

        this.setState({"logoutButton": !this.state.logoutButton})
    }

    logout = () => {
        //window.location.href = "/logout"
    }

    userLogoutForm = () => {

        if (this.state.logoutButton == true){
            return(
                <button className={"logout"} onClick={() => this.logout()}>Logout</button>
            )
        }

    }

    goHome = () => {
        window.location.href ="/"
    }

    header = () => {
        if (this.state.loggedIn){
            return(
                <div  id="header">
                     <div onClick={() => this.goHome()} id={"header-left"}>
                         <div className={"logo"}>
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
                     <div id={"header-right"}>

                        <div onClick={() => this.userLoginToggle()} className={"login-button"}>
                            <p>Login</p>
                        </div>
                         {this.userLoginForm()}

                     </div>
                 </div>
            )
        }
    }

    getUsersItems = async () => {
        var that = this
        $.ajax({
            url: "/browse/selections",
            success: (result) => {
                that.setState({"availableUsers": result})
            }
        })
    }

    nftCaseItem = (nft) => {
        //console.log(nft)
        var that = this
        let metadatauri = nft[Object.keys(nft)[0]]
        if (!Object.keys(this.state.metadata).includes(metadatauri)){
            that.state.metadata[metadatauri] = "'"
             $.ajax({
            url: metadatauri,
            success: (metadata) => {
                let currentMetadata = that.state.metadata
                console.log(metadata)
                currentMetadata[metadatauri] = metadata
                that.setState({"metadata": currentMetadata})
            }
        })
        }
    }

    toUserPage = (user) => {
        window.location.href = "/user/"+user
    }

    browseMenu = () => {
        return(
            <div>
                <h2>Available Items</h2>
                {this.state.availableUsers.map((item, idx) => (
                    <div key={idx} className={"user-row"}>
                        <h3>{Object.keys(item)[0]}'s NFTs</h3>
                        <div className={"nft-display"} onClick={() => this.toUserPage(Object.keys(item)[0])}>
                             {this.state.availableUsers[0][Object.keys(this.state.availableUsers[0])].map((nft, idnx) => {
                                 this.nftCaseItem(nft)
                                 return(
                                     <div className={"nft-case"} key={idnx}>
                                        <p>{this.state.metadata[nft[Object.keys(nft)[0]]].name}</p>
                                         <img src={this.state.metadata[nft[Object.keys(nft)[0]]].image} />
                                     </div>
                                     )
                                 }
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    getUsers = () => {
        var that = this
        this.setState({"users": []})
        $.ajax({
            url: "/search/users",
            data: {
                "query": $("#user-search-query").val()
            },
            success: (result) => {
                that.setState({"users": result})
            }
        })
    }

    goToUser = (user) => {
        window.location.href = "/user/" +user
    }

    searchUsers = () => {
        return(
            <div style={{"width": "fit-content", "marginLeft": "auto", "marginRight": "auto"}}>
                <h3>Search For Users</h3>
                <div className={"user-search"}>
                    <input type={"text"} placeholder={"Search"} id={"user-search-query"} />
                    <button onClick={() => this.getUsers()}>Search</button>
                </div>
                <div>
                    {this.state.users.map((user) => (
                        <div className={"link-button"} onClick={() => this.goToUser(user)}>{user}</div>
                    ))}
                </div>
            </div>
        )
    }


    render(){

        return(
            <div>
                {this.header()}
                {this.searchUsers()}
                {this.browseMenu()}
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById("body"))