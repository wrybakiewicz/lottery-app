.PHONY: test

accounts:
	npx hardhat accounts

compile:
	npx hardhat compile

#Localhost
node:
	npx hardhat node --no-deploy

test:
	npx hardhat test

deploy_local:
	npx hardhat deploy --network localhost

select_winner_local:
	npx hardhat run scripts/selectWinnerLocal.js --network localhost

#Rinkeby
deploy_rinkeby:
	npx hardhat deploy --network rinkeby