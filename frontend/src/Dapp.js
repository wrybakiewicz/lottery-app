import React from "react";

import LotteryArtifact from "./contracts/Lottery.json";
import contractAddress from "./contracts/contract-address.json";
import {ethers} from "ethers";
import {Buy} from "./Buy";

const HARDHAT_NETWORK_ID = '31337';

export class Dapp extends React.Component {

    constructor(props, context) {
        super(props, context);

        this.initialState = {
            selectedAddress: undefined,
            lottery: undefined,
            buyActive: true,
        };

        this.state = this.initialState;
    }

    componentDidMount() {
        this._connectWallet();
    }

    render() {
        if (window.ethereum === undefined) {
            return <h2>Install ethereum wallet wallet</h2>;
        }

        if (!this.state.selectedAddress) {
            return (
                <div>Connect your Metamask with HardHat network</div>
            );
        }

        return <div className="container p-4">
            <div className="row">
                <div className="col-12">
                    <ul className="nav nav-tabs justify-content-center">
                        <li className="nav-item">
                            <a className={"nav-link " + this.showActive(this.state.buyActive)}
                               onClick={() => this.setState({
                                   buyActive: true
                               })} href="#">Buy</a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="row">
                <div className="col-12 ">
                    {//TODO: lottery status
                        }
                    <div>
                        {this.state.buyActive && (<Buy lottery={this.state.lottery}
                                                       provider={this.state.provider}
                                                       selectedAddress={this.state.selectedAddress}/>)}
                    </div>
                </div>
            </div>

        </div>;
    }

    async _connectWallet() {
        const addresses = await window.ethereum.request({method: 'eth_requestAccounts'});
        const selectedAddress = addresses[0];

        if (!this._checkNetwork()) {
            return;
        }
        this._initialize(selectedAddress);

        window.ethereum.on("accountsChanged", ([newAddress]) => {
            if (newAddress === undefined) {
                return this._resetState();
            }

            this._initialize(newAddress);
        });

        window.ethereum.on("chainChanged", ([_]) => {
            this._resetState();

        });
    }

    _checkNetwork() {
        return window.ethereum.networkVersion === HARDHAT_NETWORK_ID;

    }

    _initialize(userAddress) {
        console.log("User address: " + userAddress);
        this.setState({
            selectedAddress: userAddress,
        });
        this._intializeEthers();
    }

    async _intializeEthers() {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const lottery = new ethers.Contract(
            contractAddress.Lottery,
            LotteryArtifact.abi,
            provider.getSigner(0)
        );
        this.setState({lottery: lottery, provider: provider});
    }

    _resetState() {
        this.setState(this.initialState);
        this._connectWallet();
    }

    showActive(value) {
        if (value) {
            return "active";
        }
        return "";
    }

}