import { ethers } from "hardhat";

class LiquidityProvider {
  constructor(tokenAddresses, positionManagerAddress, impersonatedAddress) {
    this.DAI = tokenAddresses.DAI;
    this.WETH = tokenAddresses.WETH;
    this.positionManagerAddress = positionManagerAddress;
    this.impersonatedAddress = impersonatedAddress;
    this.signer = null;
    this.contracts = {};
  }

  async initialize() {
    this.signer = await ethers.getImpersonatedSigner(this.impersonatedAddress);
    this.contracts.dai = await ethers.getContractAt("IERC20", this.DAI);
    this.contracts.weth = await ethers.getContractAt("IERC20", this.WETH);
    this.contracts.positionManager = await ethers.getContractAt(
      "INonfungiblePositionManager",
      this.positionManagerAddress
    );
  }

  async printBalances(description) {
    const wethBal = await this.contracts.weth.balanceOf(this.impersonatedAddress);
    const daiBal = await this.contracts.dai.balanceOf(this.impersonatedAddress);
    console.log(`--------------------------------------------------`);
    console.log(`Balances ${description}:`);
    console.log(`  WETH Balance: ${ethers.formatUnits(wethBal, 18)}`);
    console.log(`  DAI Balance:  ${ethers.formatUnits(daiBal, 18)}`);
    console.log(`--------------------------------------------------`);
  }

  async approveTokens(amountDAI, amountWETH) {
    console.log(`--------------------------------------------------`);
    console.log("Approving tokens for liquidity...");
    await Promise.all([
      this.contracts.dai.connect(this.signer).approve(this.positionManagerAddress, amountDAI),
      this.contracts.weth.connect(this.signer).approve(this.positionManagerAddress, amountWETH)
    ]);
    console.log("Tokens approved.");
    console.log(`--------------------------------------------------`);
  }

  async addLiquidity(amountDAI, amountWETH) {
    const params = {
      token0: this.DAI,
      token1: this.WETH,
      fee: 3000,
      tickLower: -887220,
      tickUpper: 887220,
      amount0Desired: amountDAI,
      amount1Desired: amountWETH,
      amount0Min: 0,
      amount1Min: 0,
      recipient: this.impersonatedAddress,
      deadline: Math.floor(Date.now() / 1000) + 60 * 10,
    };

    const tx = await this.contracts.positionManager.connect(this.signer).mint(params);
    await tx.wait();
    console.log(`--------------------------------------------------`);
    console.log("Liquidity added successfully!");
    console.log(`Transaction hash: ${tx.hash}`);
    console.log(`--------------------------------------------------`);
  }
}

const main = async () => {
  const provider = new LiquidityProvider({
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
  }, "0xC36442b4a4522E871399CD717aBDD847Ab11FE88", "0xf584f8728b874a6a5c7a8d4d387c9aae9172d621");

  try {
    await provider.initialize();
    await provider.printBalances("Before Liquidity Addition");

    const amountDAI = ethers.parseUnits("1000", 18);
    const amountWETH = ethers.parseUnits("1", 18);

    await provider.approveTokens(amountDAI, amountWETH);
    await provider.addLiquidity(amountDAI, amountWETH);

    await provider.printBalances("After Liquidity Addition");
  } catch (error) {
    console.log(`--------------------------------------------------`);
    console.error("An error occurred:", error);
    console.log(`--------------------------------------------------`);
    process.exitCode = 1;
  }
};

main();