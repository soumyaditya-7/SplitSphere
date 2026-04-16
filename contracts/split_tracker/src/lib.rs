#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, String, Address, Map, log, symbol_short};

/// Represents a single expense record on-chain
#[contracttype]
#[derive(Clone)]
pub struct Expense {
    pub id: u64,
    pub payer: Address,
    pub description: String,
    pub timestamp: u64,
}

/// Storage keys
#[contracttype]
pub enum DataKey {
    ExpenseCount,
    Expense(u64),
    Debt(Address, Address), // (Debtor, Creditor) -> i128
}

#[contract]
pub struct SplitTrackerContract;

#[contractimpl]
impl SplitTrackerContract {
    /// Record a new expense on-chain
    /// Returns the expense ID
    pub fn record_expense(
        env: Env,
        payer: Address,
        description: String,
        debts: soroban_sdk::Vec<(Address, i128)>,
    ) -> u64 {
        // Verify the caller is the payer
        payer.require_auth();

        // Get and increment the expense counter
        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::ExpenseCount)
            .unwrap_or(0);
        let new_id = count + 1;

        // Create the expense record
        let expense = Expense {
            id: new_id,
            payer: payer.clone(),
            description,
            timestamp: env.ledger().timestamp(),
        };

        // Store the expense
        env.storage()
            .persistent()
            .set(&DataKey::Expense(new_id), &expense);

        // Update the counter
        env.storage()
            .instance()
            .set(&DataKey::ExpenseCount, &new_id);

        // Emit an event
        env.events().publish(
            (symbol_short!("expense"), payer.clone()),
            new_id,
        );

        // Update overall debt balances
        for (debtor, amount) in debts.iter() {
            // Can't owe yourself, amount must be positive
            if debtor == payer || amount <= 0 {
                continue;
            }

            let key = DataKey::Debt(debtor.clone(), payer.clone());
            let current_debt: i128 = env.storage().persistent().get(&key).unwrap_or(0);
            
            // Add to existing debt
            let new_debt = current_debt + amount;
            env.storage().persistent().set(&key, &new_debt);
            
            env.events().publish(
                (symbol_short!("debt_add"), debtor, payer.clone()),
                amount,
            );
        }

        log!(&env, "Expense recorded: id={}", new_id);

        new_id
    }

    /// Settle a debt by executing an on-chain token transfer
    pub fn settle_debt(
        env: Env,
        debtor: Address,
        creditor: Address,
        token: Address,
        amount: i128,
    ) -> i128 {
        debtor.require_auth();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        let key = DataKey::Debt(debtor.clone(), creditor.clone());
        let current_debt: i128 = env.storage().persistent().get(&key).unwrap_or(0);

        if current_debt <= 0 {
            panic!("No outstanding debt");
        }

        // Cap settlement at max outstanding debt
        let settle_amount = if amount > current_debt { current_debt } else { amount };

        // Perform token transfer using native token contract
        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(&debtor, &creditor, &settle_amount);

        // Update debt tracking
        let new_debt = current_debt - settle_amount;
        if new_debt == 0 {
            env.storage().persistent().remove(&key);
        } else {
            env.storage().persistent().set(&key, &new_debt);
        }

        env.events().publish(
            (symbol_short!("dt_settle"), debtor, creditor),
            settle_amount,
        );

        new_debt
    }

    /// Get current debt between two parties
    pub fn get_debt(env: Env, debtor: Address, creditor: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Debt(debtor, creditor))
            .unwrap_or(0)
    }

    /// Get an expense by its ID
    pub fn get_expense(env: Env, expense_id: u64) -> Expense {
        env.storage()
            .persistent()
            .get(&DataKey::Expense(expense_id))
            .expect("Expense not found")
    }

    /// Get the total number of recorded expenses
    pub fn get_expense_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::ExpenseCount)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;
    use soroban_sdk::Env;

    #[test]
    fn test_record_and_get_expense() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(SplitTrackerContract, ());
        let client = SplitTrackerContractClient::new(&env, &contract_id);

        let payer = Address::generate(&env);
        let description = String::from_str(&env, "Test Dinner");

        // Record an expense
        let id = client.record_expense(&payer, &description, &1000000_i128, &3_u32);
        assert_eq!(id, 1);

        // Get the expense
        let expense = client.get_expense(&1_u64);
        assert_eq!(expense.id, 1);
        assert_eq!(expense.amount, 1000000_i128);
        assert_eq!(expense.participant_count, 3);

        // Check count
        let count = client.get_expense_count();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_multiple_expenses() {
        let env = Env::default();
        env.mock_all_auths();

        let contract_id = env.register(SplitTrackerContract, ());
        let client = SplitTrackerContractClient::new(&env, &contract_id);

        let payer = Address::generate(&env);

        let id1 = client.record_expense(
            &payer,
            &String::from_str(&env, "Lunch"),
            &500000_i128,
            &2_u32
        );
        let id2 = client.record_expense(
            &payer,
            &String::from_str(&env, "Dinner"),
            &1500000_i128,
            &4_u32
        );

        assert_eq!(id1, 1);
        assert_eq!(id2, 2);
        assert_eq!(client.get_expense_count(), 2);
    }
}
