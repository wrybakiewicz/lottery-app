const {network } = require("hardhat")

module.exports = async ({getNamedAccounts, deployments}) => {
    const {deploy, log} = deployments
    const {deployer} = await getNamedAccounts()
    log("Deploying mocks")
    if (network.name === "localhost") {
        log("Local network detected! Deploying mocks...")

        await deploy("VRFCoordinatorV2Mock", {contract: "VRFCoordinatorV2Mock", from: deployer, log: true, args: [1, 2]})

        log("Mocks Deployed!")
    } else {
        log("No mocks deployed")
    }
}