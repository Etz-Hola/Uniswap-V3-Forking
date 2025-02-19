import { ethers } from "hardhat";

const main = async () => {
  // Token addresses
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

  // Uniswap V3 contracts
  const NonfungiblePositionManagerAddress =
    "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

  // Impersonate an account with DAI and WETH
  const impersonatedAddress = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621"; // Replace with an address holding DAI and WETH
  const impersonatedSigner = await ethers.getImpersonatedSigner(
    impersonatedAddress
  );

  // Get contract instances
  const daiContract = await ethers.getContractAt("IERC20", DAI);
  const wethContract = await ethers.getContractAt("IERC20", WETH);
  const nonfungiblePositionManager = await ethers.getContractAt(
    "INonfungiblePositionManager",
    NonfungiblePositionManagerAddress
  );

   const wethBal = await wethContract.balanceOf(impersonatedSigner.address);
   const daiBal = await daiContract.balanceOf(impersonatedSigner.address);

   console.log(
     "impersonneted acct weth bal before adding liquidity::",
     ethers.formatUnits(wethBal, 18)
   );

   console.log(
     "impersonneted acct dai bal before adding liquidity:",
     ethers.formatUnits(daiBal, 18)
   );
  
  // Approve tokens for the NonfungiblePositionManager
  const amountDAI = ethers.parseUnits("1000", 18); // 1000 DAI
  const amountWETH = ethers.parseUnits("1", 18); // 1 WETH

  console.log("===== Tokens Approving ====")

  await daiContract
    .connect(impersonatedSigner)
    .approve(NonfungiblePositionManagerAddress, amountDAI);
  await wethContract
    .connect(impersonatedSigner)
    .approve(NonfungiblePositionManagerAddress, amountWETH);

  console.log("==== Tokens approved =====");

  // Define the pool fee (0.3% fee tier)
  const fee = 3000;

  // Define the price range for liquidity
  const tickLower = -887220; // Lower tick for the price range
  const tickUpper = 887220; // Upper tick for the price range


  // Add liquidity to the pool
  const tx = await nonfungiblePositionManager.connect(impersonatedSigner).mint({
    token0: DAI,
    token1: WETH,
    fee,
    tickLower,
    tickUpper,
    amount0Desired: amountDAI,
    amount1Desired: amountWETH,
    amount0Min: 0,
    amount1Min: 0,
    recipient: impersonatedSigner.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes from now
  });

  await tx.wait();

  console.log(tx)
  console.log("Liquidity added successfully!");

  // Log the transaction hash
  console.log(`Transaction hash: ${tx.hash}`);

   const wethBalAfter = await wethContract.balanceOf(impersonatedSigner.address);
   const daiBalAfter = await daiContract.balanceOf(impersonatedSigner.address);

   console.log(
     "impersonneted acct weth bal after adding liquidity::",
     ethers.formatUnits(wethBalAfter, 18)
   );

   console.log(
     "impersonneted acct dai bal after adding liquidity:",
     ethers.formatUnits(daiBalAfter, 18)
   );
  
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});