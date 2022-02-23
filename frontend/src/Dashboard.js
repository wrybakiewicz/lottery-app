import React from "react";
import {ethers} from "ethers";
import 'react-toastify/dist/ReactToastify.css';
import moment from "moment";
import {toast} from "react-toastify";

export class Dashboard extends React.Component {

    state = {
        ticketPrice: undefined,
        ticketsBought: undefined,
        totalTicketsBought: undefined,
        pricePool: undefined,
        winner: undefined,
    };

    componentDidMount() {
        this.update();
    }

    componentWillUnmount() {
        this.setState = () => {
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.ticketsBought === undefined) {
            this.update();
        }
    }

    render() {
        if (this.state.ticketsBought === undefined
            || !this.state.ticketPrice
            || !this.props.lotteryEndTime
            || this.state.totalTicketsBought === undefined
            || this.state.pricePool === undefined) {
            return <div></div>;
        }

        return <div className="d-flex align-items-center flex-column p-4">
            <p className="h3">Lottery end time: {this.props.lotteryEndTime.format('DD/MM/YYYY HH:mm')}</p>
            {this.renderLotteryInProgress()}
            {this.renderSelectWinner()}
            {this.renderShowWinner()}
            {this.renderWaitingForWinner()}
            <p className="h3">Ticket price: {ethers.utils.formatEther(this.state.ticketPrice)} ETH</p>
            <p className="h3">Total tickets bought: {this.state.totalTicketsBought}</p>
            <p className="h3">Your tickets: {this.state.ticketsBought}</p>
            <p className="h3">Price pool: {ethers.utils.formatEther(this.state.pricePool)} ETH</p>
        </div>
    }

    renderLotteryInProgress() {
        if (moment().isBefore(this.props.lotteryEndTime)) {
            return <div className="alert alert-success" role="alert">
                Lottery in progress !
            </div>;
        }
    }

    renderSelectWinner() {
        if (moment().isAfter(this.props.lotteryEndTime) && !this.state.winner) {
            return <div className="d-flex align-items-center flex-column p-4">
                <div className="alert alert-secondary" role="alert">
                    Lottery has ended. Run winner selection
                </div>
                <button type="submit" className="btn btn-primary" disabled={this.state.ticketsToBuy < 1}
                        onClick={() => this.selectWinner()}>Randomly select winner
                </button>
            </div>
        }
    }

    renderWaitingForWinner() {
        if (moment().isAfter(this.props.lotteryEndTime) && this.state.winner === ethers.constants.AddressZero) {
            return <div className="alert alert-secondary" role="alert">
                Lottery has ended. Waiting for winner selection.
            </div>;
        }
    }

    renderShowWinner() {
        if (moment().isAfter(this.props.lotteryEndTime) && this.state.winner && this.state.winner !== ethers.constants.AddressZero) {
            return <div className="alert alert-primary" role="alert">
                Lottery has ended. Winner: {this.state.winner}
            </div>;
        }
    }

    async update() {
        console.log("Updating Dashboard component");
        const {lottery, provider, selectedAddress} = this.props;

        if (lottery && provider && selectedAddress) {
            this.updateTotalTicketsBought();
            this.updateTicketsBought();
            this.updateTicketPrice();
            this.updateEnded();
        }
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
        lottery.ticketPrice().then(price => this.setState({ticketPrice: price}))
            .then(_ => this.updatePricePool());
    }

    updateTotalTicketsBought() {
        const {lottery} = this.props;
        lottery.ticketCount().then(ticketCount => {
            this.setState({totalTicketsBought: ticketCount.toNumber()})
        }).then(_ => this.updatePricePool());
    }

    updatePricePool() {
        if (this.state.ticketPrice !== undefined && this.state.totalTicketsBought !== undefined) {
            const pricePool = this.state.ticketPrice.mul(this.state.totalTicketsBought);
            this.setState({pricePool: pricePool});
        }
    }

    updateEnded() {
        if (moment().isAfter(this.props.lotteryEndTime)) {
            const {lottery} = this.props;
            lottery.ended().then(ended => {
                if (ended) {
                    lottery.winner().then(winner => {
                        this.setState({winner: winner})
                    });
                }
            })
        }
    }

    selectWinner() {
        const {lottery} = this.props;
        const endPromise = lottery.end()
            .then(tx => tx.wait());
        toast.promise(endPromise, {
            pending: 'End transaction in progress',
            success: 'End transaction succeed 👌',
            error: 'End transaction failed 🤯'
        });
        endPromise
            .then(_ => this.update());
    }


}