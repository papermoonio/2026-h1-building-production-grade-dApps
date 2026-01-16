import { task } from "hardhat/config";
import { spawn } from "child_process";

// Task to start PVM node with REVM support
task("start-pvm-node", "Start PVM node for EVM bytecode testing")
  .setAction(async (taskArgs, { run }) => {
    console.log("Starting PVM node for EVM bytecode testing...");

    const nodeProcess = spawn('./bin/substrate-node', [
      '--dev',
      '--rpc-port=8000',
      '--ws-port=9944'
    ], {
      stdio: 'inherit'
    });

    nodeProcess.on('close', (code) => {
      console.log(`PVM node exited with code ${code}`);
    });

    // Also start the ETH RPC adapter
    setTimeout(() => {
      console.log("Starting ETH RPC adapter...");
      const adapterProcess = spawn('./bin/eth-rpc', [], {
        stdio: 'inherit'
      });

      adapterProcess.on('close', (code) => {
        console.log(`ETH RPC adapter exited with code ${code}`);
      });
    }, 5000); // Wait 5 seconds for node to start
  });

// Task to check compatibility
task("check-compat", "Check REVM/PolkaVM compatibility")
  .setAction(async (taskArgs, { ethers, network }) => {
    console.log(`Current network: ${network.name}`);
    console.log(`Network config:`, network.config);

    // Detect if we're in REVM mode
    const isREVM = process.env.REVM === "true";
    const isPolkaNode = process.env.POLKA_NODE === "true";

    console.log(`REVM mode: ${isREVM}`);
    console.log(`PolkaNode mode: ${isPolkaNode}`);

    if (isREVM && isPolkaNode) {
      console.log("Running in REVM mode on PolkaVM infrastructure");
      console.log("Note: REVM implementation in PolkaVM may be incomplete.");
    } else if (isPolkaNode) {
      console.log("Running in PolkaVM native mode");
    } else {
      console.log("Running in standard EVM mode");
    }
  });

// Placeholder for PolkaVM-EVM related tasks
// This file is referenced in hardhat.config.ts to support PolkaVM

task("polkavm-info", "Prints PolkaVM information")
  .setAction(async (taskArgs, { ethers }) => {
    console.log("PolkaVM-EVM environment is configured");
  });