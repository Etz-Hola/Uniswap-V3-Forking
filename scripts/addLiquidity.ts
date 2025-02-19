import { ethers } from "hardhat";

const main = async () => {
  const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
  const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const NonfungiblePositionManagerAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";
  const impersonatedAddress = "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621";
  const impersonatedSigner = await ethers.getImpersonatedSigner(impersonatedAddress);

  const daiContract = await ethers.getContractAt("IERC20", DAI);
  const wethContract = await ethers.getContractAt("IERC20", WETH);
  const nonfungiblePositionManager = await ethers.getContractAt("INonfungiblePositionManager", NonfungiblePositionManagerAddress);

  const wethBal = await wethContract.balanceOf(impersonatedSigner.address);
  const daiBal = await daiContract.balanceOf(impersonatedSigner.address);

  console.log("Balances Before Liquidity Addition:");
  console.log("  WETH Balance:", ethers.formatUnits(wethBal, 18));
  console.log("  DAI Balance: ", ethers.formatUnits(daiBal, 18));
  console.log("--------------------------------------------------");
  console.log("--------------------------------------------------");

  const amountDAI = ethers.parseUnits("1000", 18);
  const amountWETH = ethers.parseUnits("1", 18);

  console.log("Approving tokens for liquidity...");
  await daiContract.connect(impersonatedSigner).approve(NonfungiblePositionManagerAddress, amountDAI);
  await wethContract.connect(impersonatedSigner).approve(NonfungiblePositionManagerAddress, amountWETH);
  console.log("Tokens approved.");
  console.log("--------------------------------------------------");
  console.log("--------------------------------------------------");

  const fee = 3000;
  const tickLower = -887220;
  const tickUpper = 887220;

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
    deadline: Math.floor(Date.now() / 1000) + 60 * 10,
  });

  await tx.wait();

  console.log("Liquidity added successfully!");
  console.log("Transaction hash:", tx.hash);
  console.log("--------------------------------------------------");
  console.log("--------------------------------------------------");

  const wethBalAfter = await wethContract.balanceOf(impersonatedSigner.address);
  const daiBalAfter = await daiContract.balanceOf(impersonatedSigner.address);

  console.log("Balances After Liquidity Addition:");
  console.log("  WETH Balance:", ethers.formatUnits(wethBalAfter, 18));
  console.log("  DAI Balance: ", ethers.formatUnits(daiBalAfter, 18));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});