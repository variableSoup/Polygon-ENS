const hre = require("hardhat");

const main = async () => {
    const domainContractFactory = await hre.ethers.getContractFactory('Domains');
    const domainContract = await domainContractFactory.deploy('roast');
    await domainContract.deployed();
    console.log('Contract deployed to:', domainContract.address);

    let registerTxn = await domainContract.registerDomain('Master', {value: hre.ethers.utils.parseEther('0.1')})
    await registerTxn.wait();
    console.log('Minted new domain !')

    const recordTxn = await domainContract.setRecord('Master', 'First domain register !')
    await recordTxn.wait()
    console.log('New record added !')

    const ownerAddress = await domainContract.getOwner('Master')
    console.log(`Owners Address: ${ownerAddress}`)

    const balance = await hre.ethers.provider.getBalance(domainContract.address)
    console.log(`Contract balance: ${hre.ethers.utils.formatEther(balance)}`)

    
}

const runMain = async () => {
    try {
        await main()
        process.exit(0)
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

runMain()