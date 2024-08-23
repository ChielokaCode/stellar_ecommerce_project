require("dotenv").config();
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Stack, Table } from "react-bootstrap";
import Image from "next/image";
import toast from "react-hot-toast";
import { useSorobanReact } from "@soroban-react/core";
import { useRegisteredContract } from "@soroban-react/contracts";
import { nativeToScVal } from "@stellar/stellar-sdk";

const Cart = (props) => {
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = React.useState(0);
  const contract = useRegisteredContract("localfoodstore");
  const [txHash, setTxHash] = useState("");
  const [showTxHash, setShowTxHash] = useState(false);

  const [amount, setAmount] = useState();
  const sorobanContext = useSorobanReact();

  const { address } = sorobanContext;

  useEffect(() => {
    // Load cart items from local storage on component mount
    const savedCartItems = localStorage.getItem("cartItems");
    if (savedCartItems) {
      setCartItems(JSON.parse(savedCartItems));
    }
  }, []);

  const updateQuantity = (id, delta) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(item.quantity + delta, 0) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  useEffect(() => {
    const calculateTotal = () => {
      return cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );
    };

    const newTotal = calculateTotal();
    setTotalAmount(newTotal * 10 ** 7);
    setAmount(newTotal);
  }, [cartItems]);

  const handleOrder = async () => {
    try {
      let userLoginCheck = localStorage.getItem("userLoginName");
      console.log(userLoginCheck);
      if (userLoginCheck === "User not found" || userLoginCheck == null) {
        toast.error("Login User to continue");
        return;
      }
      if (!contract) {
        console.error("Contract is not initialized");
        toast.error("Unable to connect to the contract. Please try again.");
        return;
      }

      if (address) {
        const result = await contract.invoke({
          method: "place_order",
          args: [
            nativeToScVal(address, { type: "address" }),
            nativeToScVal(totalAmount, { type: "i128" }),
          ],
          signAndSend: true,
        });
        console.log("Place Order result:", result);

        setTxHash(result.txHash);
        toast.success("Order Placed Successfully");

        localStorage.removeItem("cartItems");
        setCartItems([]);
      }
    } catch (error) {
      toast.error("Error during Placing Order");
      console.log("Error while Placing Order. Try again", error);
    }
  };

  const handleOrderTxHash = () => {
    setShowTxHash(!showTxHash);
  };

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
          {cartItems.map((item) => (
            <tr key={item.id}>
              <td>
                <Image
                  width={300}
                  height={200}
                  src={item.image}
                  alt={item.name}
                  className="object-cover"
                />
              </td>
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
                <Button variant="danger" onClick={() => removeItem(item.id)}>
                  Remove
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="text-right font-bold ">Total: {totalAmount} XLM</div>
      <Stack direction="horizontal">
        <div className="mt-4 text-right">
          <Stack direction="horizontal" gap={2}>
            <Button className="ml-auto" variant="primary" onClick={handleOrder}>
              Place Order
            </Button>
            <Button
              className="ml-auto"
              variant="primary"
              onClick={handleOrderTxHash}
            >
              {showTxHash ? "Hide Transaction Hash" : "Show Transaction Hash"}
            </Button>
            <div>{showTxHash ? "Order Transaction Hash: " + txHash : ""}</div>
          </Stack>
        </div>
      </Stack>
      <div className="mt-4 text-center">
        <Link href="/foodItems" passHref>
          <Button variant="success">Back to Food Store</Button>
        </Link>
      </div>
    </div>
  );
};

export default Cart;
