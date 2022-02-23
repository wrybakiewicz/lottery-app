const { ethers } = require("hardhat")

async function selectWinnerLocal() {
    const lottery = await ethers.getContract("Lottery")
    const vRFCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
    await vRFCoordinatorV2Mock.fulfillRandomWords(1, lottery.address)
    console.log("Winner selected")
}

selectWinnerLocal()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
