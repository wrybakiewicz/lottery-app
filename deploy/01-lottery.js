const hre = require("hardhat");
const fs = require("fs");
const {network, ethers} = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const {deploy, get, log} = deployments
    const {deployer} = await getNamedAccounts()

    log("Deploying lottery")
    if (network.name === "localhost") {
        const vrfCoordinatorMock = await get("VRFCoordinatorV2Mock");
        const vrfCoordinatorMockAddress = vrfCoordinatorMock.address
        const subscriptionId = await createSubscription(vrfCoordinatorMockAddress, log)
        await fundSubscription(vrfCoordinatorMockAddress, log, subscriptionId)
        await deploy("Lottery", {
            from: deployer,
            args: [subscriptionId, vrfCoordinatorMockAddress, 100, ethers.utils.parseEther("1")],
            log: true
        })
    }

}

async function createSubscription(vrfCoordinatorMockAddress, log) {
    const vrfCoordinatorMockContract = await getVrfCoordinatorMockContract(vrfCoordinatorMockAddress)
    log("Creating subscription")
    const subscriptionTx = await vrfCoordinatorMockContract.createSubscription()
    const subscription = await subscriptionTx.wait()
    const subscriptionId = subscription.events[0].args.subId
    log("Created subscription")
    log(subscriptionId)
    return subscriptionId
}

async function fundSubscription(vrfCoordinatorMockAddress, log, subscriptionId) {
    const vrfCoordinatorMockContract = await getVrfCoordinatorMockContract(vrfCoordinatorMockAddress)
    await vrfCoordinatorMockContract.fundSubscription(subscriptionId, 10 ** 5);
    log("Funded subscription")
    log(subscriptionId)
}

async function getVrfCoordinatorMockContract(vrfCoordinatorMockAddress) {
    const accounts = await ethers.getSigners()
    const signer = accounts[0]
    const VrfCoordinatorMockContract = await ethers.getContractFactory("VRFCoordinatorV2Mock")
    return new ethers.Contract(
        vrfCoordinatorMockAddress,
        VrfCoordinatorMockContract.interface,
        signer
    );
}

async function main() {
    const Lottery = await hre.ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(10, 0x6168499c0cFfCaCD319c818142124B7A15E857ab, 100, ethers.utils.parseEther("1"));

    await lottery.deployed();

    console.log("Lottery deployed to:", lottery.address);

    saveFrontendFiles(lottery);
}

function saveFrontendFiles(lottery) {
    const fs = require("fs");
    const contractsDir = __dirname + "/../frontend/src/contracts";

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
        contractsDir + "/contract-address.json",
        JSON.stringify({ Lottery: lottery.address }, undefined, 2)
    );

    const LotteryArtifact = artifacts.readArtifactSync("Lottery");

    fs.writeFileSync(
        contractsDir + "/Lottery.json",
        JSON.stringify(LotteryArtifact, null, 2)
    );
}