const {expect} = require("chai");
const {ethers, waffle} = require("hardhat");
const {time} = require('@openzeppelin/test-helpers');

describe("Lottery", function () {
    it("should deploy contract and return public variables", async function () {
        const ticketPrice = ethers.utils.parseEther("1");
        const Lottery = await ethers.getContractFactory("Lottery");
        const lotteryDuration = 100;
        const lottery = await Lottery.deploy(lotteryDuration, ticketPrice);
        const deploymentTime = await time.advanceBlock();
        await lottery.deployed();

        const lotteryEndTime = await lottery.lotteryEndTime();
        const deploymentTimeInSec = Math.round(deploymentTime.id / 1000);
        const expectedLotteryEndTime = deploymentTimeInSec + 100;
        expect(lotteryEndTime.toNumber()).to.lte(expectedLotteryEndTime + 10);
        expect(lotteryEndTime.toNumber()).to.gte(expectedLotteryEndTime - 10);
        const resultTicketPrice = await lottery.ticketPrice();
        expect(resultTicketPrice).to.equal(ticketPrice);
        const ticketCount = await lottery.ticketCount();
        expect(ticketCount).to.equal(0);
        const addressForTicket0 = await lottery.getAddressByTicketNumber(0);
        expect(addressForTicket0).to.equal('0x0000000000000000000000000000000000000000');
        const contractBalance = await waffle.provider.getBalance(lottery.address);
        expect(contractBalance).to.equal(0);
        const winner = await lottery.winner();
        expect(winner).to.equal('0x0000000000000000000000000000000000000000');
    });

    it("should buy one ticket", async function () {
        const [owner, address1] = await ethers.getSigners();
        const account1InitialBalance = await address1.getBalance();
        const ticketPrice = ethers.utils.parseEther("1");
        const Lottery = await ethers.getContractFactory("Lottery");
        const lotteryDuration = 100;
        const lottery = await Lottery.deploy(lotteryDuration, ticketPrice);
        await lottery.deployed();

        const buyTx = await lottery.connect(address1).buy({value: ticketPrice});
        const buyTxResult = await buyTx.wait();

        const ticketCount = await lottery.ticketCount();
        expect(ticketCount).to.equal(1);
        const addressForTicket0 = await lottery.getAddressByTicketNumber(0);
        expect(addressForTicket0).to.equal(address1.address);
        const addressForTicket1 = await lottery.getAddressByTicketNumber(1);
        expect(addressForTicket1).to.equal('0x0000000000000000000000000000000000000000');
        const contractBalance = await waffle.provider.getBalance(lottery.address);
        expect(contractBalance).to.equal(ticketPrice);
        const winner = await lottery.winner();
        expect(winner).to.equal('0x0000000000000000000000000000000000000000');
        expect(buyTx).to.emit(lottery, "TicketsBought").withArgs(address1.address, 1);
        const account1Balance = await address1.getBalance();
        const gasFee = buyTxResult.effectiveGasPrice.mul(buyTxResult.cumulativeGasUsed);
        expect(account1Balance).to.equal(account1InitialBalance.sub(ticketPrice).sub(gasFee));
    });

    it("should buy three tickets from different addresses", async function () {
        const [owner, address1, address2] = await ethers.getSigners();
        const account1InitialBalance = await address1.getBalance();
        const account2InitialBalance = await address2.getBalance();
        const ticketPrice = ethers.utils.parseEther("1");
        const Lottery = await ethers.getContractFactory("Lottery");
        const lotteryDuration = 100;
        const lottery = await Lottery.deploy(lotteryDuration, ticketPrice);
        await lottery.deployed();

        const buyTx1 = await lottery.connect(address1).buy({value: ticketPrice.mul(2)});
        const buyTx1Result = await buyTx1.wait();
        const buyTx2 = await lottery.connect(address2).buy({value: ticketPrice});
        const buyTx2Result = await buyTx2.wait();

        const ticketCount = await lottery.ticketCount();
        expect(ticketCount).to.equal(3);
        const addressForTicket0 = await lottery.getAddressByTicketNumber(0);
        expect(addressForTicket0).to.equal(address1.address);
        const addressForTicket1 = await lottery.getAddressByTicketNumber(1);
        expect(addressForTicket1).to.equal(address1.address);
        const addressForTicket2 = await lottery.getAddressByTicketNumber(2);
        expect(addressForTicket2).to.equal(address2.address);
        const addressForTicket3 = await lottery.getAddressByTicketNumber(3);
        expect(addressForTicket3).to.equal('0x0000000000000000000000000000000000000000');
        const contractBalance = await waffle.provider.getBalance(lottery.address);
        expect(contractBalance).to.equal(ticketPrice.mul(3));
        const winner = await lottery.winner();
        expect(winner).to.equal('0x0000000000000000000000000000000000000000');
        expect(buyTx1).to.emit(lottery, "TicketsBought").withArgs(address1.address, 2);
        expect(buyTx2).to.emit(lottery, "TicketsBought").withArgs(address2.address, 1);
        const account1Balance = await address1.getBalance();
        const gasFee1 = buyTx1Result.effectiveGasPrice.mul(buyTx1Result.cumulativeGasUsed);
        expect(account1Balance).to.equal(account1InitialBalance.sub(ticketPrice.mul(2)).sub(gasFee1));
        const account2Balance = await address2.getBalance();
        const gasFee2 = buyTx2Result.effectiveGasPrice.mul(buyTx2Result.cumulativeGasUsed);
        expect(account2Balance).to.equal(account2InitialBalance.sub(ticketPrice).sub(gasFee2));
    });

    it("should pay for 5,5 tickets and buy five tickets", async function () {
        const [owner, address1] = await ethers.getSigners();
        const account1InitialBalance = await address1.getBalance();
        const ticketPrice = ethers.utils.parseEther("1");
        const Lottery = await ethers.getContractFactory("Lottery");
        const lotteryDuration = 100;
        const lottery = await Lottery.deploy(lotteryDuration, ticketPrice);
        await lottery.deployed();

        const value = ticketPrice.mul(11).div(2);
        const buyTx = await lottery.connect(address1).buy({value: value});
        const buyTxResult = await buyTx.wait();

        const ticketCount = await lottery.ticketCount();
        expect(ticketCount).to.equal(5);
        const addressForTicket0 = await lottery.getAddressByTicketNumber(0);
        expect(addressForTicket0).to.equal(address1.address);
        const addressForTicket1 = await lottery.getAddressByTicketNumber(1);
        expect(addressForTicket1).to.equal(address1.address);
        const addressForTicket2 = await lottery.getAddressByTicketNumber(2);
        expect(addressForTicket2).to.equal(address1.address);
        const addressForTicket3 = await lottery.getAddressByTicketNumber(3);
        expect(addressForTicket3).to.equal(address1.address);
        const addressForTicket4 = await lottery.getAddressByTicketNumber(4);
        expect(addressForTicket4).to.equal(address1.address);
        const addressForTicket5 = await lottery.getAddressByTicketNumber(5);
        expect(addressForTicket5).to.equal('0x0000000000000000000000000000000000000000');
        const contractBalance = await waffle.provider.getBalance(lottery.address);
        expect(contractBalance).to.equal(value);
        const winner = await lottery.winner();
        expect(winner).to.equal('0x0000000000000000000000000000000000000000');
        expect(buyTx).to.emit(lottery, "TicketsBought").withArgs(address1.address, 5);
        const account1Balance = await address1.getBalance();
        const gasFee1 = buyTxResult.effectiveGasPrice.mul(buyTxResult.cumulativeGasUsed);
        expect(account1Balance).to.equal(account1InitialBalance.sub(ticketPrice.mul(11).div(2)).sub(gasFee1));
    });

    it("should not let buy tickets after lottery ends", async function () {
        const [owner, address1] = await ethers.getSigners();
        const ticketPrice = ethers.utils.parseEther("1");
        const Lottery = await ethers.getContractFactory("Lottery");
        const lotteryDuration = 0;
        const lottery = await Lottery.deploy(lotteryDuration, ticketPrice);
        await lottery.deployed();

        await expect(lottery.connect(address1).buy({value: ticketPrice})).to.be.revertedWith("Lottery ended");
    });

    it("should buy ticket & end lottery", async function () {
        const [owner, address1] = await ethers.getSigners();
        const account1InitialBalance = await address1.getBalance();
        const ticketPrice = ethers.utils.parseEther("1");
        const Lottery = await ethers.getContractFactory("Lottery");
        const lotteryDuration = 100;
        const lottery = await Lottery.deploy(lotteryDuration, ticketPrice);
        await lottery.deployed();
        const price = ticketPrice.mul(3).div(2);

        const buyTx = await lottery.connect(address1).buy({value: price});
        const buyTxResult = await buyTx.wait();
        await ethers.provider.send("evm_increaseTime", [lotteryDuration])
        const endTx = await lottery.end();

        const winner = await lottery.winner();
        expect(winner).to.equal(address1.address);
        expect(endTx).to.emit(lottery, "LotteryEnded").withArgs(address1.address, price);
        const account1Balance = await address1.getBalance();
        const gasFee1 = buyTxResult.effectiveGasPrice.mul(buyTxResult.cumulativeGasUsed);
        expect(account1Balance).to.equal(account1InitialBalance.sub(gasFee1));
    });

    it("should buy two tickets & end lottery", async function () {
        const [owner, address1, address2] = await ethers.getSigners();
        const account1InitialBalance = await address1.getBalance();
        const account2InitialBalance = await address2.getBalance();
        const ticketPrice = ethers.utils.parseEther("1");
        const Lottery = await ethers.getContractFactory("Lottery");
        const lotteryDuration = 100;
        const lottery = await Lottery.deploy(lotteryDuration, ticketPrice);
        await lottery.deployed();
        const bid1 = ticketPrice.mul(3).div(2);
        const bid2 = ticketPrice.mul(3);

        const buyTx1 = await lottery.connect(address1).buy({value: bid1});
        const buyTx1Result = await buyTx1.wait();
        const buyTx2 = await lottery.connect(address2).buy({value: bid2});
        const buyTx2Result = await buyTx2.wait();
        await ethers.provider.send("evm_increaseTime", [lotteryDuration])
        await lottery.end();

        const winner = await lottery.winner();
        expect(winner).to.be.oneOf([address1.address, address2.address]);
        if (winner === address1.address) {
            const account1Balance = await address1.getBalance();
            const gasFee1 = buyTx1Result.effectiveGasPrice.mul(buyTx1Result.cumulativeGasUsed);
            expect(account1Balance).to.equal(account1InitialBalance.sub(gasFee1).add(bid2));
            const account2Balance = await address2.getBalance();
            const gasFee2 = buyTx2Result.effectiveGasPrice.mul(buyTx2Result.cumulativeGasUsed);
            expect(account2Balance).to.equal(account2InitialBalance.sub(gasFee2).sub(bid2));
        } else {
            const account1Balance = await address1.getBalance();
            const gasFee1 = buyTx1Result.effectiveGasPrice.mul(buyTx1Result.cumulativeGasUsed);
            expect(account1Balance).to.equal(account1InitialBalance.sub(gasFee1).sub(bid1));
            const account2Balance = await address2.getBalance();
            const gasFee2 = buyTx2Result.effectiveGasPrice.mul(buyTx2Result.cumulativeGasUsed);
            expect(account2Balance).to.equal(account2InitialBalance.sub(gasFee2).add(bid1));
        }
    });

    it("should fail to end when there is already a winner", async function () {
        const [owner, address1] = await ethers.getSigners();
        const ticketPrice = ethers.utils.parseEther("1");
        const Lottery = await ethers.getContractFactory("Lottery");
        const lotteryDuration = 100;
        const lottery = await Lottery.deploy(lotteryDuration, ticketPrice);
        await lottery.deployed();

        await lottery.connect(address1).buy({value: ticketPrice});
        await ethers.provider.send("evm_increaseTime", [lotteryDuration])
        await lottery.end();

        await expect(lottery.end()).to.be.revertedWith("The winner has already been selected");
    });

    it("should fail to end when lottery has not ended", async function () {
        const ticketPrice = ethers.utils.parseEther("1");
        const Lottery = await ethers.getContractFactory("Lottery");
        const lotteryDuration = 100;
        const lottery = await Lottery.deploy(lotteryDuration, ticketPrice);
        await lottery.deployed();

        await expect(lottery.end()).to.be.revertedWith("Lottery have not ended");
    });

    it("should do nothing when no one participated", async function () {
        const ticketPrice = ethers.utils.parseEther("1");
        const Lottery = await ethers.getContractFactory("Lottery");
        const lotteryDuration = 100;
        const lottery = await Lottery.deploy(lotteryDuration, ticketPrice);
        await lottery.deployed();

        await ethers.provider.send("evm_increaseTime", [lotteryDuration])
        await lottery.end();
    });

});
