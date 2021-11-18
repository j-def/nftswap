
class App extends React.Component{
    constructor(props) {
        super(props);

        this.state = {"pubKey": "",
            "loggedIn": false,
            "logoutButton": false,
            "loginForm": false,
            "availableUsers": [],
            "metadata": {},
            "users": [],
            "collections": [],
            "selectedMetadata": "",
            "selectedURI": "",
            "mintVerification": [],
            "limitedCollections": []
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
        window.location.href = "/logout"
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

    getUsersItems =  () => {
        var that = this
        $.ajax({
            url: "/browse/selections",
            data:{
                "query": $("#user-search-query").val()
            },
            success: (result) => {
                that.setState({"availableUsers": result.usermints, "mintVerification": result.verification})
            }
        })
    }

    nftCaseItem = (nft) => {
        var that = this
        let metadatauri = nft.minturi
        if (!Object.keys(this.state.metadata).includes(metadatauri)){
            that.state.metadata[metadatauri] = "'"
             $.ajax({
            url: metadatauri,
            success: (metadata) => {
                let currentMetadata = that.state.metadata
                currentMetadata[metadatauri] = metadata
                that.setState({"metadata": currentMetadata})
            }
        })
        }
    }

    toUserPage = (user) => {
        window.location.href = "/user/"+user
    }

    openmetadata = (metamint, metauri) => {
        this.setState({"selectedMetadata": metamint, "selectedURI": metauri})
    }

    renderMetadata = () => {


        var close = () => {
             this.setState({"selectedMetadata": "", "selectedURI": ""})
        }

        if (this.state.selectedMetadata.length > 0){

            var verified = ""
            var verifiedB = ""
            var tempMeta = this.state.mintVerification[this.state.selectedMetadata]
            verified = tempMeta[0]
            verifiedB= tempMeta[1]
            var metadata = this.state.metadata[this.state.selectedURI]

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

    verifiedStatusText = (mint) => {
        return(<p>{this.state.mintVerification[mint][0]}</p>)
    }

    restrictNfts = (nft) => {
        if (this.state.limitedCollections.length == 0){
            return true
        }
        if (!Object.keys(this.state.mintVerification).includes(nft.mint)){
            return true
        }
        if (this.state.limitedCollections.includes( this.state.mintVerification[nft.mint][1])){
            return true
        }
        return false
    }

    browseMenu = () => {

        var emptyDisplay = ""
        if (this.state.availableUsers.length == 0){
            emptyDisplay = <h3>Search resulted in 0 users</h3>
        }

        return(
            <div>
                <h2>Available Items</h2>
                {emptyDisplay}
                {this.state.availableUsers.map((item, idx) => (
                    <div key={idx} className={"user-row"}>
                    <div onClick={() => this.toUserPage(item.username)} style={{"marginBottom": "20px","cursor": "pointer","width": "fit-content", "marginLeft": "auto", "marginRight": "auto", "border": "solid 1px white", "padding": "5px 20px", "borderRadius": "5px"}}>

                        <h3 >{item.username}'s NFTs</h3>
                    </div>
                        <div className={"nft-display"}>
                            <div className={"user-row-flex"} >
                                 {item.mintdata.map((nft, idnx) => {
                                     this.nftCaseItem(nft)
                                     if (this.restrictNfts(nft)){
                                         return(
                                         <div onClick={() => this.openmetadata(nft.mint, nft.minturi)} className={"nft-case"} key={idnx}>
                                             {this.verifiedStatusText(nft.mint)}
                                             <p>{this.state.metadata[nft.minturi].name}</p>
                                             <img src={this.state.metadata[nft.minturi].image} />
                                         </div>
                                         )
                                     }

                                     }
                                )}
                            </div>

                        </div>
                    </div>
                ))}
            </div>
        )
    }

    getUsers = () => {
        var that = this
        this.setState({"users": []})
        this.getUsersItems()
        $.ajax({
            url: "/search/users",
            data: {
                "query": $("#user-search-query").val()
            },
            success: (result) => {
                console.log(result)
                that.setState({"users": result.users})
            }
        })
    }

    goToUser = (user) => {
        window.location.href = "/user/" +user
    }

    searchResultsDisplay = () => {
        var userDisplayText = ""
        if (this.state.users.length > 0){
            userDisplayText = <p>Users</p>
        }
        /*
        var userCollectionText = ""
        if (this.state.collections.length > 0){
            userCollectionText = <p>Collections</p>
        }

         */

        return(
             <div>
                 {userDisplayText}
                 <div style={{"maxHeight": "125px", "overflow": "auto"}}>
                    {this.state.users.map((user) => (
                        <div className={"link-button"} onClick={() => this.goToUser(user)}>{user}</div>
                    ))}
                 </div>


            </div>
        )
    }

    addCollectionFilter = () => {
        let currentCollection  = this.state.limitedCollections
        if (!currentCollection.includes($("#filter-selection").val())){
            currentCollection.push($("#filter-selection").val())
            this.setState({"limitedCollections": currentCollection})
        }

    }

    removeCollectionFilter = (item) => {
        let currentCollection  = this.state.limitedCollections
        if (currentCollection.includes($("#filter-selection").val())){
            currentCollection.splice(currentCollection.indexOf(item), 1)
            this.setState({"limitedCollections": currentCollection})
        }
    }

    searchUsers = () => {
        return(
            <div style={{"width": "fit-content", "marginLeft": "auto", "marginRight": "auto"}}>
                <h3>Search For Users</h3>
                <div className={"user-search"}>
                    <input type={"text"} placeholder={"Search"} id={"user-search-query"} />
                    <button onClick={() => this.getUsers()}>Search</button>
                </div>
                {this.searchResultsDisplay()}
                <div className={"filters"}>
                    <h4>Filters</h4>
                    <div style={{"display": "flex", "gap": "10px"}}>
                         <div>
                            <select id={"filter-selection"}>
                                <option value={"Solana Koalas"}>Solana Koalas</option>
                                <option value={"SolYetis"}>SolYetis</option>
                            </select>
                             <br />
                            <button onClick={() => this.addCollectionFilter()}>Add Filter</button>
                        </div>
                        <div>
                            {this.state.limitedCollections.map((item) => (
                                <button onClick={() => {this.removeCollectionFilter(item)}} className={"filter-item-display"}>{item}</button>
                            ))}
                        </div>
                    </div>


                </div>
            </div>
        )
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


    render(){

        return(
            <div>
                {this.header()}
                {this.searchUsers()}
                {this.browseMenu()}
                {this.footer()}
                {this.renderMetadata()}
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById("body"))