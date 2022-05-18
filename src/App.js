import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import './App.css';

import contractAbi from './utils/contractAbi.json'

import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks';

function App() {

  const tld = '.roast'
  const contractAddress = '0x4a572a59cCe8fe48894b3b5026DAcc473f4bb63a'
  
  const [wallet, setWallet] = useState('')
  const [domain, setDomain] = useState('')
  const [record, setRecord] = useState('')
  const [network, setNetwork] = useState('')
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mints, setMints] = useState([]);

  const checkForWallet = async () => {
    
    const { ethereum } = window;

    if (!ethereum) {
      console.log('Make sure you have metamask!');
      return;
    } else {
      console.log('We have the ethereum object', ethereum);
    }
    
    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
      const account = accounts[0];
      console.log('Found an authorized account:', account);
      setWallet(account);
    } else {
      console.log('No authorized account found');
    }
    
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    setNetwork(networks[chainId]);

    ethereum.on('chainChanged', handleChainChanged);
    
    function handleChainChanged(_chainId) {
      window.location.reload();
    }

  }

  const mint = async () => {
    
    if (!domain) {return}

    if (domain.length < 3) {
      alert('Domain must contain more than 3 characters')
      return;
    }

    const price = domain.length === 3 ? '0.5' : domain.length === 4 ? '0.3' : '0.1';
  	console.log("Minting domain", domain, "with price", price);

    try {
      const { ethereum } = window
      const provider = new ethers.providers.Web3Provider(ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, contractAbi.abi, signer)

      console.log('paying gas...')

      let txn = await contract.registerDomain(domain, {value: ethers.utils.parseEther(price)})
      const receipt = await txn.wait()

      if (receipt.status === 1) {
				console.log("Domain minted! https://mumbai.polygonscan.com/tx/" + txn.hash);
				
				const tx = await contract.setRecord(domain, record);
				await tx.wait();

				console.log("Record set! https://mumbai.polygonscan.com/tx/"+tx.hash);

        setTimeout(() => {
          fetchMints();
        }, 2000);
				
				setRecord('');
				setDomain('');
			}
			else {
				alert("Transaction failed! Please try again");
			}
    } catch(error) {
      console.error(error)
    }
  }

  const fetchMints = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        // You know all this
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddress, contractAbi.abi, signer);
          
        // Get all the domain names from our contract
        const names = await contract.getAllNames();
          
        // For each name, get the record and the address
        const mintRecords = await Promise.all(names.map(async (name) => {
        const mintRecord = await contract.records(name);
        const owner = await contract.domainList(name);
        return {
          id: names.indexOf(name),
          name: name,
          record: mintRecord,
          owner: owner,
        };
      }));
  
      console.log("MINTS FETCHED ", mintRecords);
      setMints(mintRecords);
      }
    } catch(error){
      console.log(error);
    }
  }

  const updateDomain = async () => {
    if (!record || !domain) { return }
    setLoading(true);
    console.log("Updating domain", domain, "with record", record);
    try {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractAbi.abi, signer);

      let tx = await contract.setRecord(domain, record);
      await tx.wait();
      console.log("Record set https://mumbai.polygonscan.com/tx/"+tx.hash);

      fetchMints();
      setRecord('');
      setDomain('');
    }
    } catch(error) {
      console.log(error);
    }
    setLoading(false);
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask -> https://metamask.io/");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    
      console.log("Connected", accounts[0]);
      setWallet(accounts[0]);
    } catch (error) {
      console.log(error)
    }
  }

  const switchNetwork = async () => {
    if (window.ethereum) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x13881' }],
        });
      } catch (error) {
        
        if (error.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {	
                  chainId: '0x13881',
                  chainName: 'Polygon Mumbai Testnet',
                  rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
                  nativeCurrency: {
                      name: "Mumbai Matic",
                      symbol: "MATIC",
                      decimals: 18
                  },
                  blockExplorerUrls: ["https://mumbai.polygonscan.com/"]
                },
              ],
            });
          } catch (error) {
            console.log(error);
          }
        }
        console.log(error);
      }
    } else {
      alert('MetaMask is not installed. Please install it to use this app: https://metamask.io/download.html');
    } 
  }
  
  const renderButton = () => {
    return (
      <div className='connect-container'>
        <button  onClick={connectWallet} className='connect-btn'>
          Connect
        </button>
      </div>
      
    )
  }

  const renderInput = () => {
    
    if (network !== 'Polygon Mumbai Testnet') {
      return (
        <div className="switch-network call-to-action">
          <h4 style={{textAlign: 'center'}}>Please switch to Polygon Mumbai Testnet</h4>
          <button type='submit' className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
        </div>
      );
    }

    return(
      <div className="form-container">
        
        <div className='forms'>
        <input
          type="text"
          value={domain}
          placeholder='domain'
          onChange={e => setDomain(e.target.value)}
        />
        <p className='tld'> {tld} </p>
        
        <input
          type='text'
          value={record}
          placeholder='Website, Greeting, Song etc...'
          onChange={e => setRecord(e.target.value)}
        />

          {editing ? (
            <div className=''>
              <button className='' disabled={loading} onClick={updateDomain}>
                Set record
              </button>  
              <button className='' onClick={() => {setEditing(false)}}>
                Cancel
              </button>  
            </div>
          ) : (
            <button type='submit' className='' disabled={loading} onClick={mint}>
              Mint
            </button>  
          )}
        </div>
      </div>
    )
  }

  const renderMints = () => {
    if (wallet && mints.length > 0) {
      return (
        <div className="mint-box">
          <p className=""> Recently minted domains!</p>
          <div className="mint-collection">
            { mints.map((mint, index) => {
              return (
                <div className="mint-tab grid call-to-action" key={index}>
                  <div className='mint-row'>
                    <a className="link" href={`https://testnets.opensea.io/assets/mumbai/${contractAddress}/${mint.id}`} target="_blank" rel="noopener noreferrer">
                      <p className="underlined">{' '}{mint.name}{tld}{' '}</p>
                    </a>
                    {/* If mint.owner is currentAccount, add an "edit" button*/}
                    { mint.owner.toLowerCase() === wallet.toLowerCase() ?
                      <button className="edit-button" onClick={() => editRecord(mint.name)}>
                        <img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
                      </button>
                      :
                      null
                    }
                    <p> {mint.record} </p>
                  </div>
          </div>)
          })}
        </div>
      </div>);
    }
  };

  const editRecord = (name) => {
    console.log("Editing record for", name);
    setEditing(true);
    setDomain(name);
  }

  useEffect(() => {
    checkForWallet()
  }, [])

  useEffect(() => {
    if (network === 'Polygon Mumbai Testnet') {
      fetchMints();
    }
  }, [wallet, network]);

  return (
    <div className="app">
      
      <div className=" flex network-info">
        <img alt="Network logo" className="logo rotate" src={ network.includes("Polygon") ? polygonLogo : ethLogo} />
        { wallet ? <p> Wallet ({wallet.slice(0, 6)}...{wallet.slice(-4)} )</p> : <p> (Not connected) </p> }
      </div>
      
      <header className='headers' >
      
        <h1>Roast Name Service</h1>
        
        <h3>Bringing the Roast to the blockchain</h3>
        
        {!wallet && renderButton()}
      
      </header>

      {wallet && renderInput()}

      {mints && renderMints()}
      
    </div>
  );
}

export default App;