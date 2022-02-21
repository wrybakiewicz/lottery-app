const hre = require("hardhat");
const fs = require("fs");
const {ethers} = require("ethers");

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

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
