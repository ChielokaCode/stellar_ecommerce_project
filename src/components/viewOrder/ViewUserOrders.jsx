import React, { useEffect, useState } from "react";
import { useRegisteredContract } from "@soroban-react/contracts";
import { nativeToScVal, scValToNative } from "@stellar/stellar-sdk";
import { useSorobanReact } from "@soroban-react/core";
import toast from "react-hot-toast";
import { Button } from "react-bootstrap";

const ViewUserOrders = () => {
  const contract = useRegisteredContract("localfoodstore");
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;
  const [orderList, setOrderList] = useState([]);

  const handleViewOrder = async () => {
    try {
      let userLoginCheck = localStorage.getItem("userLoginName");
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
          method: "get_orders_by_user",
          args: [nativeToScVal(address, { type: "address" })],
        });
        console.log("View Orders result:", result);
        if (result) {
          const result_viewAllUserOrders = scValToNative(result);

          console.log(result_viewAllUserOrders);
          if (
            result_viewAllUserOrders !== null &&
            result_viewAllUserOrders !== undefined
          ) {
            setOrderList(result_viewAllUserOrders);
            toast.success("User Orders fetched Successfully");
          }
        }
      }
    } catch (error) {
      toast.error("Error during fetching User Orders");
      console.log("Error while Fetching User Orders. Try again", error);
    }
  };

  function convertId(num) {
    const numberValue = Number(num);
    return numberValue;
  }

  function convertAmount(num) {
    const numberValue = Number(num);
    return numberValue / 10_000_000;
  }

  function convertDateAndTime(timestamp) {
    const milliseconds = Number(timestamp) * 1000;
    const date = new Date(milliseconds);
    return date.toLocaleString();
  }

  return (
    <>
      <Button
        variant="success"
        className="hover:bg-green-200"
        onClick={handleViewOrder}
      >
        View Order
      </Button>
      <div className="p-4 space-y-4">
        {orderList.length === 0 ? (
          <p className="flex justify-center items-center text-center text-2xl text-black">
            No Orders yet
          </p>
        ) : (
          orderList.map((order, index) => (
            <div
              key={convertId(order.id) || index}
              className="p-4 border rounded-lg shadow-md bg-white mb-4"
            >
              <p className="text-lg">
                <strong className="font-bold">Amount: </strong>
                {convertAmount(order.amount)} <strong>XLM</strong>
              </p>
              <p className="text-lg">
                <strong className="font-bold">Fulfilled: </strong>
                {order.fulfilled ? "Yes" : "No"}
              </p>
              <p className="text-lg">
                <strong className="font-bold">ID: </strong>
                {convertId(order.id)}
              </p>
              <p className="text-lg">
                <strong className="font-bold">Timestamp: </strong>
                {convertDateAndTime(order.timestamp)}
              </p>
              <br />
              <h3 className="text-xl font-semibold">
                <strong>Order Items</strong>
              </h3>
              <div className="space-y-2">
                {order.items.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No items in this order
                  </p>
                ) : (
                  order.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="border-t pt-2">
                      <p className="text-lg">
                        <strong className="font-bold">Name: </strong>
                        {item[0]} {/* Assuming item has item_name */}
                      </p>
                      <p className="text-lg">
                        <strong className="font-bold">Price: </strong>
                        {convertAmount(item[2])} <strong>XLM</strong>
                      </p>
                      <p className="text-lg">
                        <strong className="font-bold">Quantity: </strong>
                        {item[1]}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default ViewUserOrders;
