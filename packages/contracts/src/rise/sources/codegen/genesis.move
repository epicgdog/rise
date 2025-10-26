#[allow(lint(share_owned))]module rise::genesis {

  use sui::clock::Clock;

  use dubhe::dapp_service::DappHub;

  use rise::dapp_key;

  use dubhe::dapp_system;

  use std::ascii::string;

  use rise::player;

  use rise::landmark;

  use rise::monster;

  use rise::health;

  use rise::experience;

  use rise::level;

  use rise::name;

  use rise::description;

  use rise::position;

  public entry fun run(dapp_hub: &mut DappHub, clock: &Clock, ctx: &mut TxContext) {
    // Create Dapp
    let dapp_key = dapp_key::new();
    dapp_system::create_dapp(dapp_hub, dapp_key, string(b"rise"), string(b"mud game on the blockchain"), clock, ctx);
    // Register tables
    player::register_table(dapp_hub, ctx);
    landmark::register_table(dapp_hub, ctx);
    monster::register_table(dapp_hub, ctx);
    health::register_table(dapp_hub, ctx);
    experience::register_table(dapp_hub, ctx);
    level::register_table(dapp_hub, ctx);
    name::register_table(dapp_hub, ctx);
    description::register_table(dapp_hub, ctx);
    position::register_table(dapp_hub, ctx);
    // Logic that needs to be automated once the contract is deployed
    rise::deploy_hook::run(dapp_hub, ctx);
  }

  public(package) fun upgrade(dapp_hub: &mut DappHub, new_package_id: address, new_version: u32, ctx: &mut TxContext) {
    // Upgrade Dapp
    let dapp_key = dapp_key::new();
    dapp_system::upgrade_dapp(dapp_hub, dapp_key, new_package_id, new_version, ctx);
    // Register new tables
    // ==========================================
    // ==========================================
  }
}
