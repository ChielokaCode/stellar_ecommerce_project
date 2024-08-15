import React, { useState } from 'react'
import { Button, Container, Stack } from 'react-bootstrap';
import toast from 'react-hot-toast';
import {useSorobanReact} from "@soroban-react/core";



const Reward = () => {
    const [rewardAmt, setRewardAmt] = useState<number>(20);
    const sorobanContext = useSorobanReact();
    const { address } = sorobanContext;

    const handleClaimReward = () => {
      if(!address){
        toast.error("Connect Wallet to continue");
        return
      }
      if(rewardAmt == 0){
        toast.error("You don't have a reward, Place Order above 50 XLM");
        return
      }
      setRewardAmt(0);
      toast.success("Reward Claimed Successfully")
    }
  return (
    <Container>
      
        <h5 className='m-4'><b>Note: </b>You can start earning after you have bought orders over 50 XLM</h5>
        <div className='w-1/4 bg-zinc-300 rounded-xl shadow-lg border-2 border-black p-4 m-4'>
            <Stack direction='vertical' gap={50}>
                <Stack direction='horizontal'>
            <h4>Your daily reward:</h4> 
            <h5 className='ms-auto'>XLM {rewardAmt}</h5>
            </Stack>
            <h3>Click on button to claim</h3>
            <Button variant="success" onClick={handleClaimReward}>Claim Reward</Button>
            </Stack>
        </div>
      
        </Container>
  )
}

export default Reward;