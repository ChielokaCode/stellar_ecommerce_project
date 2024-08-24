#![no_std]
mod test;

use core::cmp;
use soroban_sdk::token::TokenClient;
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Order(u64),
    Recipient,
    User(Address),
    UserOrders(Address),
    Token,
    RecipientClaimed,
    TargetAmount,
    OrderCounter,
    UserOrderTracker(Address),
    Balance(Address),
    UserRewards(Address),
    UserTransactionId(Address),
    UserRegId(Address),
    UserCounter,
}

#[contracttype]
pub struct Token {
    pub address: Address,
}

#[derive(Clone)]
#[contracttype]
pub struct UserOrderTracker {
    total_value: i128,
    reward_percentage: u32,
    rewards: Vec<i128>,
}

#[derive(Clone)]
#[contracttype]
pub struct CartItem {
    name: String,
    quantity: u32,
    price: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct Order {
    id: u64,
    user: Address,
    amount: i128,
    fulfilled: bool,
    timestamp: u64,
    items: Vec<CartItem>,
}


#[derive(Clone)]
#[contracttype]
pub struct User {
    id: u64,
    user: Address,
    name: String,
    email: String,
    registered: bool,
    timestamp: u64,
}

#[contract]
pub struct LocalFoodNetwork;

#[contractimpl]
impl LocalFoodNetwork {
    pub fn token(e: Env) -> Address {
        Self::get_token(&e)
    }

    pub fn recipient(e: Env) -> Address {
        Self::get_recipient(&e)
    }

    fn get_recipient(e: &Env) -> Address {
        e.storage()
            .persistent()
            .get::<_, Address>(&DataKey::Recipient)
            .expect("not initialized")
    }

    fn get_token(e: &Env) -> Address {
        e.storage()
            .persistent()
            .get::<_, Address>(&DataKey::Token)
            .expect("not initialized")
    }

    fn get_balance(e: &Env, contract_id: &Address) -> i128 {
        let client = TokenClient::new(e, contract_id);
        client.balance(&e.current_contract_address())
    }

    pub fn transfer_xlm(env: Env, from: Address, to: Address, amount: i128) -> u64 {
        from.require_auth();
        let xlm_address_str = String::from_str(
            &env,
            "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
        );
        let xlm_address = Address::from_string(&xlm_address_str);
        env.storage()
            .persistent()
            .set(&DataKey::Token, &xlm_address);
        let token = TokenClient::new(&env, &xlm_address);
        token.transfer(&from, &to, &amount);
        let tx_id = env.ledger().sequence();
        env.storage()
            .persistent()
            .set(&DataKey::UserTransactionId(from.clone()), &tx_id);
        tx_id.into()
    }

    pub fn register(e: Env, user_address: Address, name: String, email: String) -> bool {
        user_address.require_auth();

        let key = DataKey::User(user_address.clone());

        // Check if user already exists
        if e.storage().persistent().has(&key) {
            return false; // User already registered
        }

        let user_id = e
            .storage()
            .persistent()
            .get(&DataKey::UserCounter)
            .unwrap_or(0)
            + 1;

        e.storage()
            .persistent()
            .set(&DataKey::UserCounter, &user_id);

        let user = User {
            id: user_id,
            user: user_address.clone(),
            name: name.clone(),
            email: email.clone(),
            registered: true,
            timestamp: e.ledger().timestamp(),
        };

        e.storage()
            .persistent()
            .set(&DataKey::User(user_address.clone()), &user);

        // Generate a unique transaction ID (using the current ledger sequence number)
        let user_reg_id = e.ledger().sequence();

        // Store the transaction ID
        e.storage()
            .persistent()
            .set(&DataKey::UserRegId(user_address.clone()), &user_reg_id);

        //more checks to know if user successfully registered
        return true;
    }

    pub fn login(e: Env, user_address: Address) -> String {
        user_address.require_auth();
    
        let key = DataKey::User(user_address.clone());
    
        if let Some(user) = e.storage().persistent().get::<_, User>(&key) {
            user.name
        } else {
            soroban_sdk::String::from_str(&e, "User not found")
        }
    }
    
    

    pub fn initialize(e: Env, recipient: Address, target_amount: i128, token: Address) {
        assert!(
            !e.storage().persistent().has(&DataKey::Recipient),
            "already initialized"
        );

        e.storage()
            .persistent()
            .set(&DataKey::Recipient, &recipient);
        e.storage()
            .persistent()
            .set(&DataKey::TargetAmount, &target_amount);
        e.storage().persistent().set(&DataKey::Token, &token);
    }

    pub fn place_order(e: Env, user: Address, amount: i128, items: Vec<CartItem>) -> u64 {
        user.require_auth();
        // Validate the input
        assert!(amount > 0, "amount must be positive");
        // Define the XLM address and token client
        let xlm_address_str = String::from_str(
            &e,
            "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
        );
        let xlm_address = Address::from_string(&xlm_address_str);
        let token_client = TokenClient::new(&e, &xlm_address);
        // Get the contract's address
        let contract_address: Address = e.current_contract_address();
        // Transfer XLM from the user to the contract
        token_client.transfer(&user, &contract_address, &amount);
        // Retrieve and increment the order counter using persistent storage
        let order_id = e
            .storage()
            .persistent()
            .get(&DataKey::OrderCounter)
            .unwrap_or(0)
            + 1;
        e.storage()
            .persistent()
            .set(&DataKey::OrderCounter, &order_id);
        // Create the new order
        let order = Order {
            id: order_id,
            user: user.clone(),
            amount,
            fulfilled: true,
            timestamp: e.ledger().timestamp(),
            items,
        };
        // Store the order using persistent storage
        e.storage()
            .persistent()
            .set(&DataKey::Order(order_id), &order);

        // Retrieve the user's order vector or create a new one if it doesn't exist
        let mut user_orders = e
           .storage()
           .persistent()
           .get(&DataKey::UserOrders(user.clone()))
           .unwrap_or_else(|| Vec::new(&e));

        // Append the new order object to the user's order vector
        user_orders.push_back(order);

        // Save the updated user order vector back to persistent storage
        e.storage()
         .persistent()
         .set(&DataKey::UserOrders(user.clone()), &user_orders);



        // Retrieve and update the user's total order value tracker
        let mut tracker = e
            .storage()
            .persistent()
            .get::<_, UserOrderTracker>(&DataKey::UserOrderTracker(user.clone()))
            .unwrap_or(UserOrderTracker {
                total_value: 0,
                reward_percentage: 2,
                rewards: Vec::new(&e),
            });
        tracker.total_value += amount;
        // Calculate and store the reward if the total order value exceeds the threshold
        let reward_amount = if tracker.total_value >= 1_000_000_000 {
            let reward = (tracker.total_value * tracker.reward_percentage as i128) / 100;
            tracker.total_value = 0; // Reset total_value after reaching the threshold

            if tracker.reward_percentage == 2 {
                tracker.reward_percentage = 1; // Change to 1% for subsequent rewards
            }
            reward
        } else {
            0 // No reward if total_value is below the threshold
        };
        if reward_amount > 0 {
            tracker.rewards.push_back(reward_amount);

            // Store cumulative rewards using persistent storage
            let mut user_rewards = e
                .storage()
                .persistent()
                .get::<_, Vec<i128>>(&DataKey::UserRewards(user.clone()))
                .unwrap_or(Vec::new(&e));

            user_rewards.push_back(reward_amount);

            e.storage()
                .persistent()
                .set(&DataKey::UserRewards(user.clone()), &user_rewards);
        }
        // Store the updated tracker using persistent storage
        e.storage()
            .persistent()
            .set(&DataKey::UserOrderTracker(user.clone()), &tracker);
        order_id
    }

    pub fn get_order(e: Env, order_id: u64) -> Order {
        e.storage()
            .persistent()
            .get(&DataKey::Order(order_id))
            .unwrap_or_else(|| panic!("Order not found"))
    }

    pub fn get_total_user_rewards(e: Env, user: Address) -> i128 {
        // user.require_auth();
        let rewards = e
            .storage()
            .persistent()
            .get::<_, Vec<i128>>(&DataKey::UserRewards(user))
            .unwrap_or(Vec::new(&e));
        rewards.iter().sum()
    }

    pub fn process_user_reward(e: Env, user: Address) -> bool {
        user.require_auth();
    
        let total_reward = Self::get_total_user_rewards(e.clone(), user.clone());
    
        if total_reward == 0 {
            return false; // No rewards to process
        }
    
        // Perform the withdrawal
        let xlm_address_str = String::from_str(
            &e,
            "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
        );
        let xlm_address = Address::from_string(&xlm_address_str);
        let token_client = TokenClient::new(&e, &xlm_address);
    
        // Get the contract's address
        let contract_address = e.current_contract_address();
    
        // Transfer XLM from the contract to the user
        token_client.transfer(&contract_address, &user, &total_reward);
    
        // Clear the tracker rewards vector
        let mut tracker = e
            .storage()
            .persistent()
            .get::<_, UserOrderTracker>(&DataKey::UserOrderTracker(user.clone()))
            .unwrap_or(UserOrderTracker {
                total_value: 0,
                reward_percentage: 2,
                rewards: Vec::new(&e),
            });
    
        tracker.rewards = Vec::new(&e);
        tracker.total_value = 0;
    
        // Update the tracker in storage
        e.storage()
            .persistent()
            .set(&DataKey::UserOrderTracker(user.clone()), &tracker);
    
        // Clear the UserRewards vector
        let user_rewards: Vec<i128> = Vec::new(&e); // Initialize a new, empty Vec<i128>

        // Update the persistent storage with the cleared vector
        e.storage()
            .persistent()
            .set(&DataKey::UserRewards(user.clone()), &user_rewards);
    
        true // Rewards were successfully processed and cleared
    }

    pub fn get_orders_by_user(e: Env, user: Address) -> Vec<Order> {
        // Retrieve the user's order vector from persistent storage
        let user_orders = e
            .storage()
            .persistent()
            .get(&DataKey::UserOrders(user.clone()))
            .unwrap_or_else(|| Vec::new(&e)); // Return an empty vector if the user has no orders
    
        user_orders
    }
    
}
