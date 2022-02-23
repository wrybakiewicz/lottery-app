import React from "react";
import {ethers} from "ethers";
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export class Buy extends React.Component {

    state = {
        accountBalance: undefined,
        ticketsBought: undefined,
        ticketsToBuy: ""
    };

    componentDidMount() {
        this.update();
    }

    componentWillUnmount() {
        this.setState = () => {
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (!this.state.accountBalance && this.state.ticketsBought === undefined) {
            this.update();
        }
    }

    render() {
        if (!this.state.accountBalance || this.state.ticketsBought === undefined || !this.state.ticketPrice) {
            return <div></div>;
        }

        return <div className="d-flex justify-content-center p-4">
            <form>
                <p className="h3">Account balance: {this.state.accountBalance}</p>
                <p className="h3">Bought tickets: {this.state.ticketsBought}</p>
                <p className="h3">Ticket price: {ethers.utils.formatEther(this.state.ticketPrice)} ETH</p>

                <div className="form-group p-4">
                    <label>Number of tickets</label>
                    <input type="number" className="form-control" placeholder="Number of tickets"
                           value={this.state.ticketsToBuy}
                           onChange={e => this.setState({ticketsToBuy: e.target.value})}/>
                </div>
                <button type="submit" className="btn btn-primary" disabled={this.state.ticketsToBuy < 1} onClick={() => this.buy()}>Buy</button>
            </form>
        </div>
    }

    async update() {
        console.log("Updating Buy component");
        const {lottery, provider, selectedAddress} = this.props;

        if (lottery && provider && selectedAddress) {
            this.updateAccountBalance();
            this.updateTicketsBought();
            this.updateTicketPrice();
        }
    }

    updateAccountBalance() {
        const {provider, selectedAddress} = this.props;
        provider.getBalance(selectedAddress).then((balance) => {
            const balanceInEth = ethers.utils.formatEther(balance);
            const formattedBalance = parseFloat(balanceInEth).toFixed(2);
            this.setState({accountBalance: formattedBalance});
        });
    }

    updateTicketsBought() {
        const {lottery, selectedAddress} = this.props;
        const filter = lottery.filters.TicketsBought(selectedAddress, null);
        lottery.queryFilter(filter)
            .then(events => events.map((e) => parseInt(e.args.count)).reduce((accumulator, current) => accumulator + current, 0)
        ).then(ticketsBought => this.setState({ticketsBought: ticketsBought}));
    }

    updateTicketPrice() {
        const {lottery} = this.props;
        lottery.ticketPrice().then(price => this.setState({ticketPrice: price}));
    }

    buy() {
        const {lottery} = this.props;
        const value = this.state.ticketPrice.mul(this.state.ticketsToBuy);
        const buyPromise = lottery.buy({value: value})
            .then(tx => tx.wait());
        toast.promise(buyPromise, {
            pending: 'Buy transaction in progress',
            success: 'Buy transaction succeed 👌',
            error: 'Buy transaction failed 🤯'
        });
        buyPromise
            .then(_ => this.setState({ticketsToBuy: ""}))
            .then(_ => this.update());

    }

}