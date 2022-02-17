// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Lottery {

    uint public lotteryEndTime;
    uint public ticketPrice;
    mapping(uint => address) private ticketNumberToAddress;
    uint public ticketCount;
    address public winner;

    event TicketsBought(address buyer, uint count);
    event LotteryEnded(address winner, uint price);

    constructor (uint _lotteryDuration, uint _ticketPrice) {
        require(_lotteryDuration >= 0, "Lottery duration must be >= 0");
        require(_ticketPrice > 0, "Ticket price must be > 0");

        lotteryEndTime = block.timestamp + _lotteryDuration;
        ticketPrice = _ticketPrice;
    }

    modifier beforeLotteryEnd() {
        require(block.timestamp < lotteryEndTime, "Lottery ended");
        _;
    }

    modifier afterLotteryEnd() {
        require(block.timestamp >= lotteryEndTime, "Lottery have not ended");
        _;
    }

    modifier noWinner() {
        require(winner == address(0), "The winner has already been selected");
        _;
    }

    modifier noOneParticipated() {
        if (ticketCount == 0) {
            return;
        }
        _;
    }

    function buy() external payable beforeLotteryEnd {
        uint ticketNumber = msg.value / ticketPrice;
        for (uint i = ticketCount; i < ticketNumber + ticketCount; i++) {
            ticketNumberToAddress[i] = msg.sender;
        }
        ticketCount += ticketNumber;
        emit TicketsBought(msg.sender, ticketNumber);
    }

    function getAddressByTicketNumber(uint ticketNumber) public view returns (address) {
        return ticketNumberToAddress[ticketNumber];
    }

    function end() external afterLotteryEnd noWinner noOneParticipated {
        uint blockNumber = block.number;
        bytes32 blockHashNow = blockhash(blockNumber - 1);
        uint256 hash = uint256(blockHashNow);
        uint winningTicket = hash % ticketCount;
        winner = ticketNumberToAddress[winningTicket];
        uint award = address(this).balance;
        bool sent = payable(winner).send(award);
        require(sent, "Failed to send price to winner");
        emit LotteryEnded(winner, award);
    }

}
