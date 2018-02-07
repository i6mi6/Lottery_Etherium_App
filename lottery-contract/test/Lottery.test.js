/* global beforeEach it describe */
const assert = require('assert')
const ganache = require('ganache-cli')
const Web3 = require('web3')
const provider = ganache.provider()
const web3 = new Web3(provider)

const contract = require('../compile')

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts()
  lottery = await new web3.eth.Contract(JSON.parse(contract.interface))
    .deploy({ data: contract.bytecode })
    .send({ from: accounts[0], gas: '1000000' })
  lottery.setProvider(provider);
})

describe('Lottery contract', () => {
  it('deploys a contract', () => {
    assert.ok(lottery.options.address)
  })

  it('allows one account to enter', async () => {
    await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('0.02', 'ether') })
    const players = await lottery.methods.getPlayers().call({ from: accounts[0] })
    assert.equal(accounts[0], players[0])
    assert.equal(players.length, 1)
  })

  it('allows multiple accounts to enter', async () => {
    await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('0.02', 'ether') })
    await lottery.methods.enter().send({ from: accounts[1], value: web3.utils.toWei('0.02', 'ether') })
    await lottery.methods.enter().send({ from: accounts[2], value: web3.utils.toWei('0.02', 'ether') })
    const players = await lottery.methods.getPlayers().call({ from: accounts[0] })
    assert.equal(accounts[0], players[0])
    assert.equal(accounts[1], players[1])
    assert.equal(accounts[2], players[2])
    assert.equal(players.length, 3)
  })

  it('requires a minimum amount of eth to enter', async () => {
    try {
      await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('0.001', 'ether') })
      assert(false)
    } catch (error) {
      assert(error)
    }
  })

  it('manager can call pickWinner', async () => {
    await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('0.02', 'ether') })
    await lottery.methods.pickWinner().send({ from: accounts[0] })
  })

  it('others can\'t call pickWinner', async () => {
    try {
      await lottery.methods.pickWinner().send({ from: accounts[1] })
      assert(false)
    } catch (error) {
      assert(error)
    }
  })

  it('transfers ether to winner', async () => {
    await lottery.methods.enter().send({ from: accounts[0], value: web3.utils.toWei('2', 'ether') })
    var initialBalance = await web3.eth.getBalance(accounts[0])
    await lottery.methods.pickWinner().send({ from: accounts[0] })
    var finalBalance = await web3.eth.getBalance(accounts[0])
    const difference = finalBalance - initialBalance
    assert(difference > web3.utils.toWei('1.8', 'ether'))
  })
})