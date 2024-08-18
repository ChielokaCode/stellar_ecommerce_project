import React, { useState } from "react";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import { ConnectButton } from "../web3/ConnectButton";
import { Stack } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { useSorobanReact } from "@soroban-react/core";
import { useRegisteredContract } from "@soroban-react/contracts";
import { nativeToScVal } from "@stellar/stellar-sdk";

function NavBar() {
  const router = useRouter();
  const [logInUser, setLogInUser] = useState(false);
  const sorobanContext = useSorobanReact();
  const { address } = sorobanContext;
  const contract = useRegisteredContract("localfoodstore");

  const navigateRegPage = () => {
    router.push("/register");
  };

  // const navigateLoginPage =() => {
  //   router.push("/foodItems");
  // };

  const handleLogin = async () => {
    if (!address) {
      toast.error("Please connect wallet to continue");
      return;
    }
    // try {
    const result = await contract.invoke({
      method: "login",
      args: [nativeToScVal(address, { type: "address" })],
      signAndSend: true,
    });
    toast.success("User Logged In Successfully");
    setLogInUser(true);
    router.push("/foodItems");
  };

  // const handleLogOut = () => {
  //   setLogInUser(false);
  // };

  return (
    <Navbar expand="lg" className="bg-body-tertiary">
      <Container>
        <Navbar.Brand as={Link} href="/">
          D'VILLA Food Store
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse>
          <Nav
            className="me-auto my-3 my-lg-0"
            style={{ maxHeight: "150px" }}
            navbarScroll
          >
            <Nav.Link as={Link} href="/">
              Home
            </Nav.Link>
            <Nav.Link as={Link} href="/foodItems">
              Food Store
            </Nav.Link>
            <Nav.Link as={Link} href="/cart">
              Cart
            </Nav.Link>
            <Nav.Link as={Link} href="/reward">
              Rewards
            </Nav.Link>
          </Nav>
          <Stack direction="horizontal" gap={3}>
            <div>{logInUser}</div>
            <Stack direction="horizontal" gap={2}>
              <Button variant="success" onClick={navigateRegPage}>
                Register
              </Button>
              <Button variant="success" onClick={handleLogin}>
                Login
              </Button>
            </Stack>
            <ConnectButton />
          </Stack>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;
