// import * as Dvilla from 'dvillaLocalFoodStore/dvilla-token/dist/types';
import * as LocalFoodStore from 'localfoodstore-contract';
import { SorobanRpc } from '@stellar/stellar-sdk';
import config from './config.json';

const { network, rpcUrl } = config

// Initialize Soroban RPC server
export const server = new SorobanRpc.Server(rpcUrl, {
  allowHttp: true,
})

// rpcUrl.startsWith('http:')


// Initialize LocalFoodStore contract
export const localfoodstore = new LocalFoodStore.Contract({
  rpcUrl,
  ...LocalFoodStore.networks[network as keyof typeof LocalFoodStore.networks],
})


