module dubhe::wrapper_system;
use std::u64;
use dubhe::assets_functions;
use sui::balance;
use sui::balance::Balance;
use sui::coin;
use sui::coin::{Coin};
use std::type_name;
use dubhe::errors::{overflows_error};
use dubhe::asset_type;
use dubhe::dapp_service::DappHub;
use dubhe::asset_wrapper;
use dubhe::dapp_key;
use dubhe::dapp_system;
use std::ascii::{String};
use dubhe::asset_wrap;
use dubhe::asset_unwrap;

public entry fun wrap<T>(dapp_hub: &mut DappHub, coin: Coin<T>, beneficiary: address, ctx: &mut TxContext): u256 {
      let dapp_key = dapp_key::new();
      let coin_type = get_coin_type<T>();
     asset_wrapper::ensure_has(dapp_hub, coin_type);
      let asset_id =asset_wrapper::get(dapp_hub, coin_type);
      let amount = coin.value();
      let pool_balance = dapp_system::get_mut_dapp_objects(dapp_hub, dapp_key).borrow_mut<address, Balance<T>>(asset_id);
      pool_balance.join(coin.into_balance());
      assets_functions::do_mint(dapp_hub, asset_id, beneficiary, amount as u256);
      asset_wrap::set(dapp_hub, ctx.sender(), beneficiary, amount as u256, coin_type, asset_id);
      amount as u256
}

public entry fun unwrap<T>(dapp_hub: &mut DappHub, amount: u256, beneficiary: address, ctx: &mut TxContext) {
      let coin =  do_unwrap<T>(dapp_hub, beneficiary, amount, ctx);
      transfer::public_transfer(coin, beneficiary);
}

public(package) fun do_register<T>(dapp_hub: &mut DappHub, name: String, symbol: String, description: String, decimals: u8, icon_url: String): address {
      let asset_id = assets_functions::do_create(
            dapp_hub, 
            asset_type::new_wrapped(),
            @0x0, 
            name, 
            symbol, 
            description, 
            decimals, 
            icon_url, 
            false, 
            false, 
            true,
      );
      let coin_type = get_coin_type<T>();
     asset_wrapper::set(dapp_hub, coin_type, asset_id);
      let dapp_key = dapp_key::new();
      dapp_system::get_mut_dapp_objects(dapp_hub, dapp_key).add(asset_id, balance::zero<T>());
      asset_id
}

public(package) fun do_unwrap<T>(dapp_hub: &mut DappHub, beneficiary: address, amount: u256, ctx: &mut TxContext): Coin<T> {
      overflows_error(amount <= u64::max_value!() as u256);
      let coin_type = get_coin_type<T>();
      asset_wrapper::ensure_has(dapp_hub, coin_type);
      let asset_id =asset_wrapper::get(dapp_hub, coin_type);
      assets_functions::do_burn(dapp_hub, asset_id, ctx.sender(), amount);
      let dapp_key = dapp_key::new();
      let pool_balance = dapp_system::get_mut_dapp_objects(dapp_hub, dapp_key).borrow_mut<address, Balance<T>>(asset_id);
      let balance = pool_balance.split(amount as u64);
      asset_unwrap::set(dapp_hub, ctx.sender(), beneficiary, amount as u256, coin_type, asset_id);
      coin::from_balance<T>(balance, ctx)
}

public fun get_coin_type<T>(): String {
    type_name::get<T>().into_string()
}