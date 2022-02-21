.PHONY: test

accounts:
	npx hardhat accounts

compile:
	npx hardhat compile

test:
	npx hardhat test

deploy_local:
	npx hardhat run scripts/01-lottery.js --network localhost

node:
	npx hardhat node