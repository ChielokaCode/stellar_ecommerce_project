import React, { useEffect, useState } from 'react';
import { useSorobanReact } from "@soroban-react/core";
import { Server, TransactionBuilder, Networks, Asset, Operation, Keypair, Horizon } from 'stellar-sdk';
import toast from 'react-hot-toast';
import * as loadFoodStoreContract from "soroban/contract-ids/localfoodstore.json";
import { signTransaction } from "@stellar/freighter-api";
import config from '../../../shared/config.json';
import { useRouter } from 'next/router';
import { Button } from 'react-bootstrap';

export const PlaceOrderButton = ({ amount_order, setCartItem }) => {
       const { network, networkPassphrase } = config
        const sorobanContext = useSorobanReact();
        const { address } = sorobanContext;
        const router = useRouter();
      
        const placeOrderInvokeContract = async () => {
          if (!address) {
            toast.error("Connect Wallet to proceed");
            return;
          }
      
          try {
            // Set up the Stellar testnet server
            const server = new Horizon.Server('https://horizon-testnet.stellar.org', { allowHttp: true });
      
            const contractId = loadFoodStoreContract.ids['Test SDF Network ; September 2015'];
            
      
            // Load the source account
            const sourceAccount = await server.loadAccount(address);
      
            // Build the transaction
            const transaction = new TransactionBuilder(sourceAccount, {
              fee: await server.fetchBaseFee(),
              networkPassphrase: Networks.TESTNET
            })
              .addOperation(Operation.invokeHostFunction({
                function: 'place_order',
                parameters: [
                  { type: 'address', value: address },
                  { type: 'i128', value: amount_order }
                ],
                contractId: contractId
              }))
              .setTimeout(30)
              .build();
      
            // Sign the transaction using Freighter
            const signedXDR = await signTransaction(transaction.toXDR(), {
              network: network,
              networkPassphrase: networkPassphrase,
              accountToSign: address
            });
      
            // Convert the signed XDR back to a transaction object
            const signedTransaction = TransactionBuilder.fromXDR(signedXDR, networkPassphrase);
      
            // Submit the transaction
            const submitResponse = await server.submitTransaction(signedTransaction);
      
            console.log('Transaction submitted:', submitResponse);


      
            if (submitResponse.successful) {
              localStorage.removeItem('cartItems');
              console.log('Transaction successful. Hash:', submitResponse.hash);
              toast.success('Order placed successfully!');
              setCartItem([]);
              router.push("/order-successful");
            } else {
              console.error('Transaction failed:', submitResponse.extras.resultCodes);
              toast.error('Failed to place order. Please try again.');
            }
      
          } catch (error) {
            console.error('Error invoking contract:', error);
            toast.error('An error occurred. Please try again.');
          }
        };
      
        return (
          <Button onClick={placeOrderInvokeContract}>Place Order</Button>
        );
};