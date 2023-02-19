import web3 from 'web3'
import{setGLobalState, getGLobalState}  from "./store"
import abi from "./abis/DAO.json"
import { connected } from 'process'

const  {ethereum} = window

window.web3 = new Web3(ethereum)
window.web3= new Web3(window.web3.currentProvider)

const connectWallet = async() => {
    try{
        if(!ethereum) return alert("Please install Metamask Extension")
        const accounts = await ethereum.request({method: "eth_requestAccounts"})
        setGLobalState('connectedAccount', accounts[0].toLowerCase())
    }catch(error){
        reportError(error)
    }
}

const isWalletConnected = async() => {
    try {
        if(!ethereum) return alert("Please install Metamask Extension")
        const accounts = await ethereum.request({method: "eth_accounts"})

        window.ethereum.on('chainChanged', (chainId) => {
            window.location.reload()
        })

        window.ethereum.on('accountsChanged',async()=>{
            setGLobalState('connectedAccount', accounts[0].toLowerCase())
            await isWalletConnected()
        })

        if(accounts.length){
           setGLobalState('connectedAccount', accounts[0].toLowerCase())
        } else {
            alert("please connect wallet")
            console.log("no accounts found")
        }
    }
    catch (error){
        reportError(error)
    }
}

const getEthereumContract = async() =>{
    const connectedAccount = getGlobalState('connectedAccount')
    if(connectedAccount){
        const web3 = window.web3
        const networkId = await web3.eth.net.getId()
        const networkData= await abi.networks[networkId]
        if(networkData){
            const contract = new web3.eth.Contract(abi.abi, networkData.address)
            return contract
        }
        else {
            return null
        }
    }else {
        return getGlobalState('contract')
    }
}

performContribute = async(amount) => {
    try{
        amount = window.web3.utils.toWei(amount.toString(), 'ether')
        const contract = await getEthereumContract()
        const account = getGLobalState("connectedAccount")
        await contract.methods.contribute().sender({from : account, value: amount})
        window.location.reload()
    }
    catch(error) {
        reportError(error);
        return error
    }
}


const getInfo = async() =>{
    try {
        if(!ethereum) return alert("Please install Metamask Extension")
        const contract = await getEthereumContract()
        const connectedAccount = getGLobalState("connectedAccount")
        const isStakeholder = await contract.methods.isStakeholder()
        .call({from:connectedAccount})
        const balance = await contract.methods.daoBalance().call()
        const myBalance = await contract.methods.getBalance().call({from:connectedAccount})
        setGLobalState('Balance', window.web3.utils.fromWei(balance))
        setGLobalState('myBalance', window.web3.utils.fromWei(myBalance))
        setGLobalState('isStakeholder', isStakeholder)
    }catch(error){
        reportError(error)
    }
}

const raiseProposal = async({title, description, beneficiary, amount}) => {
    
    try{
        amount = window.wb3.utils.toWei(amount.toString(), 'ether')
        const contract= await getEthereumContract()
        const account = getGlobalState('connectedAccount')
        
        await contract.methods
        .createProposal(title, description,beneficiary, amount)
        .send({from: account})

        window.location.reload()
    }catch(error){
        reportError(error)
    }
} 

const getProposals = async() => {
    try{
        if(!ethereum) return alert("Please install Metamask")

        const contract = await getEthereumContract()
        const proposals = await contract.methods.getProposals().call()

        setGLobalState('proposals', structuredProposals(proposals))
    }catch(error){
        reportError(error)
    }
}

const structuredProposals = (proposals) => {
    return proposals.map( (proposal) =>({
        id:         proposal.id,
        amount:     window.web3.utils.fromWei(proposals.amount),
        title:      proposal.title,
        description:proposal.description,
        paid:       proposal.paid,
        passed:     proposal.passed,
        proposer:   proposal.proposer,
        upvotes:    Number(proposal.upvotes),
        downvotes:  Number(proposal.downvotes),
        beneficiary: proposal.beneficiary,
        executor:   proposal.executor,
        duration:   proposal.duration
    }))
}

const getProposal = async(id) => {
    try {
        const proposals = getGlobalState("proposals");
        return proposals.find((proposal) => proposal.id == id)
    }catch(error){
        reportError(error)
    }
}

const votedOnProposal= async(proposalId, supported) => {
    try {
        const contract = await getEthereumContract()
        const account = getGlobalState("connectedAccount")
        await contract.methods.Vote(proposalId, supported)
        .send({from:account})

        window.location.reload()
    }catch(error){
        reportError(error)
    }
}

const listVoters = async() => {
    try {
        const contract = await getEthereumContract()
        const votes = await contract.methods.getVotesOf(id).call()
        return votes
    }catch(error){
        reportError(error)
    }
}

const payoutBeneficiary = async(id) => {
    try {
        const contract = await getEthereumContract()
        const account = getGlobalState ("connectedAccount")
        await contract.methods.payBeneficiary(id).send({from: account})
        window.location.reload()
    }catch(error){
        reportError(error)
    }
}

const reportError = (error) => {
    console.log(JSON.stringify(error),"red")
    throw new Error('No ethereum object, something is wrong')
}

export {
    isWalletConnected,
    connectWallet,
    performContribute,
    getInfo,
    raiseProposal,
    getProposals,
    getProposal,
    getVotesOf,
    votedOnProposal,
    listVoters,
    payoutBeneficiary
}
