# Lottery Dapp

Create a Lottery dApp where users can buy tickets to participate. The money they spent on the tickets is added to a pool. After a pre-defined number of blocks has been mined, a winner is chosen randomly who receives all the funds from the pool.

Note: You can use a simple random number generation schemes derived from block hashes. There's no need to integrate a VRF via an Oracle (although you might want to try that as well).
You can add a timelock-like feature where funds will be automatically sent back to the depositor after a certain number of blocks has been mined and the funds haven't been withdrawn by user B.

## How to run on localhost
- `make node`
- `make compile deploy_local`
- from ./frontend `npm install` `npm start`
- after lottery end `make select_winner_local`