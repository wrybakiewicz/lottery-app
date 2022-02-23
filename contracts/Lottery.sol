// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract Lottery is VRFConsumerBaseV2 {

    VRFCoordinatorV2Interface COORDINATOR;

    uint64 subscriptionId;
    address link = 0x01BE23585060835E02B77ef475b0Cc51aA1e0709;
    uint32 callbackGasLimit = 100000;
    uint16 requestConfirmations = 3;
    bytes32 keyHash = 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc;

    uint256 public randomRequestId;
    address public contractOwner;
    uint32 numberOfWords = 1;

    uint public lotteryEndTime;
    uint public ticketPrice;
    mapping(uint => address) private ticketNumberToAddress;
    uint public ticketCount;
    address public winner;
    bool public ended;

    event TicketsBought(address indexed buyer, uint count);
    event LotteryEnded(uint ticketCount);
    event WinnerSelected(address winner, uint price);

    constructor (uint64 _subscriptionId, address coordinator, uint _lotteryDuration, uint _ticketPrice) VRFConsumerBaseV2(coordinator) {
        require(_lotteryDuration >= 0, "Lottery duration must be >= 0");
        require(_ticketPrice > 0, "Ticket price must be > 0");

        lotteryEndTime = block.timestamp + _lotteryDuration;
        ticketPrice = _ticketPrice;

        COORDINATOR = VRFCoordinatorV2Interface(coordinator);
        contractOwner = msg.sender;
        subscriptionId = _subscriptionId;
    }

    modifier beforeLotteryEnd() {
        require(block.timestamp < lotteryEndTime, "Lottery ended");
        _;
    }

    modifier afterLotteryTimeEnd() {
        require(block.timestamp >= lotteryEndTime, "Lottery have not ended");
        _;
    }

    modifier notEnded() {
        require(!ended, "Function end has been called already");
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

    function end() external afterLotteryTimeEnd notEnded {
        if (ticketCount != 0) {
            requestRandomNumber();
        }
        ended = true;
        emit LotteryEnded(ticketCount);
    }

    function requestRandomNumber() internal {
        randomRequestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            numberOfWords
        );
    }

    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        uint randomNumber = randomWords[0];
        uint winningTicket = randomNumber % ticketCount;
        winner = ticketNumberToAddress[winningTicket];
        uint award = address(this).balance;

        bool sent = payable(winner).send(award);
        require(sent, "Failed to send price to winner");
        emit WinnerSelected(winner, award);
    }


}
