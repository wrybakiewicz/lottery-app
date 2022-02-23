const {network, ethers, run} = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const {deploy, get, log} = deployments
    const {deployer} = await getNamedAccounts()
    let subscriptionId
    let vrfCoordinator
    const lotteryDuration = 50
    let ticketPrice = ethers.utils.parseEther("0.001")
    let keyHash

    log("Deploying lottery")
    if (network.name === "localhost") {
        log("Deploying lottery on localhost")
        const vrfCoordinatorMock = await get("VRFCoordinatorV2Mock");
        vrfCoordinator = vrfCoordinatorMock.address
        subscriptionId = await createSubscription(vrfCoordinator, log)
        keyHash = '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc'
        await fundSubscription(vrfCoordinator, log, subscriptionId)
    } else if(network.name === "rinkeby") {
        log("Deploying lottery on rinkeby")
        vrfCoordinator = '0x6168499c0cFfCaCD319c818142124B7A15E857ab'
        keyHash = '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc'
        subscriptionId = 591;
    } else {
        throw new Error("Cannot deploy lottery - unsupported network")
    }
    const args = [subscriptionId, vrfCoordinator, lotteryDuration, ticketPrice, keyHash];
    const lottery = await deploy("Lottery", {
        from: deployer,
        args: args,
        log: true
    })
    saveFrontendFiles(lottery.address)
    if(network.name === "rinkeby") {
        await run("verify:verify", {
            address: lottery.address,
            constructorArguments: args,
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

function saveFrontendFiles(lotteryAddress) {
    const fs = require("fs");
    const contractsDir = __dirname + "/../frontend/src/contracts";

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
        contractsDir + "/contract-address.json",
        JSON.stringify({ Lottery: lotteryAddress }, undefined, 2)
    );

    const LotteryArtifact = artifacts.readArtifactSync("Lottery");

    fs.writeFileSync(
        contractsDir + "/Lottery.json",
        JSON.stringify(LotteryArtifact, null, 2)
    );
}