import React, { useState, ChangeEvent } from 'react';
import { Button } from 'react-bootstrap';
import { useRouter } from 'next/router';
import  { isConnected, getPublicKey } from "@stellar/freighter-api";
import toast from 'react-hot-toast';
import { ConnectButton } from '../web3/ConnectButton';
import { Stack } from 'react-bootstrap';
import NavBar from '../navbar/NavBar';
import { localfoodstore } from 'shared/contracts';
import { Address } from 'stellar-sdk';
import {useSorobanReact} from "@soroban-react/core";
import type { WalletChain } from '@soroban-react/types'



const Register: React.FC = () => {
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const router = useRouter();

  const sorobanContext = useSorobanReact();
  const {activeChain, address, disconnect, setActiveConnectorAndConnect, setActiveChain} = sorobanContext;
  const browserWallets = sorobanContext.connectors;
  const supportedChains = sorobanContext.chains;
 
  // const sorobanAddress = Address.fromString(recipientAddress);

    const handleRegister = async () => {      
      if (!address) {
        toast.error("Wallet not connected!");
        return;
      }

        if (!userName || !userEmail) {
          toast.error("Please fill in all details to proceed");
          return;
        }
      
        try {
          const checkUserHasConnected = await isConnected();
          
          if (!checkUserHasConnected) {
            toast.error("Please connect Wallet to continue");
            return;
          }
      
          try{
            if (address) {
          const result = await localfoodstore.register({
            user_address: address,
            name: userName,
            email: userEmail
          });
          if (result){
            router.push("/foodItems");
          }
        }
        }catch(error){
          toast.error("Error during connecting to Rpc server")
          console.log("Error during connecting to Rpc server", error)
        }      
        } catch (error) {
          console.error("Error during Connecting:", error);
          toast.error("An error occurred. Please try again.");
        }
      };


  const handleNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setUserName(e.target.value);
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setUserEmail(e.target.value);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
    <NavBar/>
    <div className="flex items-center justify-center min-h-screen bg-gray-100 m-4">
      <Button className="ms-auto bg-transparent text-black" onClick={handleBack}>Back</Button>
      
      <div className="px-8 py-6 mt-4 text-left bg-white h-screen m-4">
      
        <h1 className="text-4xl font-bold text-center">Register Your Account</h1>
        
        <form className="mt-4">
          <div>
            <label className="block" htmlFor="name">Name: </label>
            <br/>
            <input
              type="text"
              placeholder="Name"
              id="name"
              className="w-full px-1 py-2 mt-2 border-2 border-black rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              required
              value={userName}
              onChange={handleNameChange}
            />
          </div>
          <div className="mt-4">
            <label className="block" htmlFor="email">Email: </label>
            <br/>
            <input
              type="email"
              placeholder="Email"
              id="email"
              className="w-full px-1 py-2 mt-2 border-2 border-black rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              required
              value={userEmail}
              onChange={handleEmailChange}
            />
          </div>
          <div className="flex items-center justify-center mt-4">
            <Button 
            variant="success" 
            onClick={handleRegister}>
              Register
            </Button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default Register;