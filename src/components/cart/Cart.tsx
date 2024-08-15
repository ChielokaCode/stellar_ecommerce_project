require('dotenv').config();
import React, { useEffect, useState } from 'react';
import StellarSdk from 'stellar-sdk';
import Link from 'next/link';
import { Button, Stack, Table } from 'react-bootstrap';
import Image from 'next/image';
import { HStack, position } from '@chakra-ui/react';
import toast, { ToastBar } from 'react-hot-toast';
import { isConnected, getPublicKey } from '@stellar/freighter-api';
import {useSorobanReact} from "@soroban-react/core";
import { PlaceOrderButton } from '../utils/StellarFreighter';


// Define the type for cart items
interface CartItem {
  id: number;
  image: string;
  name: string;
  price: number;
  quantity: number;
}

export interface IResSubmit {
    status: string
    value?: string
    symbol?: string
    error?: string
  }

const Cart: React.FC = props => {
    const [balance, setBalance] = React.useState<number>(0)
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [decimals, setDecimals] = React.useState<number>(0);
    const [symbol, setSymbol] = React.useState<string>("");
    const [account, setAccount] = React.useState<string>("");
    const [totalAmount, setTotalAmount] = React.useState<number>(0)
    const [dvlaBalance, setDVLABalance] = useState(0)

    const [amount, setAmount] = useState<number>()
    const sorobanContext = useSorobanReact();

    const { address } = sorobanContext;

    useEffect(() => {
      // Load cart items from local storage on component mount
      const savedCartItems = localStorage.getItem('cartItems');
      if (savedCartItems) {
        setCartItems(JSON.parse(savedCartItems));
      }
    }, []);


    const updateQuantity = (id: number, delta: number) => {
        setCartItems(items => items.map(item =>
          item.id === id ? { ...item, quantity: Math.max(item.quantity + delta, 0) } : item
        ));
    };

    const removeItem = (id: number) => {
        setCartItems(items => items.filter(item => item.id !== id));
    };

    useEffect(() => {
        const calculateTotal = () => {
          return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
        };
        
        const newTotal = calculateTotal();
        setTotalAmount(newTotal * 10 ** 7);
        setAmount(newTotal);
      }, [cartItems]);

    // const handleOrder = async() => {
    //     if(!address){
    //         toast.error("Please connect wallet to continue");
    //         return
    //     }
    //     const result = await placeOrderInvokeContract();

    //     if(result){
    //         toast.error("Connect Wallet to proceed");
    //         return
    //     }
        
    // };

    return (
        <div className="p-4">
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th className="border border-gray-300 p-2">Image</th>
                        <th className="border border-gray-300 p-2">Name</th>
                        <th className="border border-gray-300 p-2">Price</th>
                        <th className="border border-gray-300 p-2">Quantity</th>
                        <th className="border border-gray-300 p-2">Remove</th>
                    </tr>
                </thead>
                <tbody>
                    {cartItems.map(item => (
                        <tr key={item.id}>
                            <td><Image width={300} height={200} src={item.image} alt={item.name} className="object-cover"/></td>
                            <td>{item.name}</td>
                            <td>{item.price} XLM</td>
                            <td className="flex items-center justify-center">
                                <Button
                                    variant="secondary"
                                    onClick={() => updateQuantity(item.id, -1)}
                                    disabled={item.quantity <= 1}
                                >
                                    -
                                </Button>
                                <span className="mx-2">{item.quantity}</span>
                                <Button
                                    variant="secondary"
                                    onClick={() => updateQuantity(item.id, 1)}
                                >
                                    +
                                </Button>
                            </td>
                            <td>
                                <Button
                                    variant="danger"
                                    onClick={() => removeItem(item.id)}
                                >
                                    Remove
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <div className="text-right font-bold ">Total: {totalAmount} XLM</div>
            <HStack>
            <div className="mt-4 text-right">
                {/* <Button className='ml-auto' variant="primary" onClick={handleOrder}>Place Order</Button> */}
                <PlaceOrderButton amount_order={totalAmount} setCartItem={setCartItems} />
            </div>
            </HStack>
            <div className="mt-4 text-center">
                <Link href="/foodItems" passHref>
                    <Button variant="success">Back to Food Store</Button>
                </Link>
            </div>
        </div>
    );
};

export default Cart;
