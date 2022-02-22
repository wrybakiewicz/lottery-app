.PHONY: test

accounts:
	npx hardhat accounts

compile:
	npx hardhat compile

test:
	npx hardhat test

deploy_local:
	npx hardhat deploy --network localhost

node:
	npx hardhat node --no-deploy