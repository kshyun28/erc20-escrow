// SPDX-License-Identifier: MIT
// Derived from OpenZeppelin Contracts 
// (https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/escrow/Escrow.sol)

pragma solidity ^0.8.18;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../interfaces/IERC20.sol";

/**
 * @title Escrow
 * @dev Base escrow contract, holds funds designated for a payee until they
 * withdraw them.
 *
 * Intended usage: This contract (and derived escrow contracts) should be a
 * standalone contract, that only interacts with the contract that instantiated
 * it. That way, it is guaranteed that all Ether will be handled according to
 * the `Escrow` rules, and there is no need to check for payable functions or
 * transfers in the inheritance tree. The contract that uses the escrow as its
 * payment method should be its owner, and provide public methods redirecting
 * to the escrow's deposit and withdraw.
 */
contract Escrow is Ownable {
    using Address for address payable;

    event Deposited(address indexed payor, address token, uint256 weiAmount);
    event Withdrawn(address indexed payee, address token, uint256 weiAmount);
    event Refunded(address indexed payee, address token, uint256 weiAmount);
    event WithdrawnFee(address indexed payee, address token, uint256 weiAmount);

    mapping(address => mapping(address => uint256)) public escrowBalance;
    mapping(address => uint256) public escrowCommissionBalance;

    uint256 public escrowFee;

    constructor(uint256 _escFee) {
        escrowFee = _escFee;
    }

    /**
     * @dev Stores the sent amount as credit to be withdrawn.
     * 
     * @param payor The source address of the funds.
     * @param token The address of specified ERC20 token.
     * @param amount The amount of specified ERC20 token in wei.
     *
     * Emits a {Deposited} event.
     */
    function deposit(
        address payor,
        address token,
        uint256 amount
    ) public virtual onlyOwner {
        require(amount > 0, "Token amount must be greater than 0");

        IERC20(token).transferFrom(payor, address(this), amount);
        escrowBalance[payor][token] += amount;

        emit Deposited(payor, token, amount);
    }

    /**
     * @dev Withdraw accumulated balance for a payee, forwarding all gas to the
     * recipient.
     *
     * WARNING: Forwarding all gas opens the door to reentrancy vulnerabilities.
     * Make sure you trust the recipient, or are either following the
     * checks-effects-interactions pattern or using {ReentrancyGuard}.
     *
     * @param payor The address whose funds are currently deposited.
     * @param payee The address whose funds will be withdrawn and transferred to.
     * @param token The address of specified ERC20 token.
     * 
     * Emits a {Withdrawn} event.
     */
    function withdraw(
        address payor,
        address payee,
        address token
    ) public virtual onlyOwner {
        uint256 fee = (escrowBalance[payor][token] * escrowFee) / 100;
        IERC20(token).transfer(payee, escrowBalance[payor][token] - fee);

        // Remove depositor escrow balance, then capture fee in commission balance
        escrowBalance[payor][token] = 0;
        escrowCommissionBalance[token] += fee;

        emit Withdrawn(payee, token, escrowBalance[payor][token]);
    }

    /**
     * @dev Withdraw accumulated fee balance for a payee, forwarding all gas to the
     * recipient.
     * 
     * @param payee The address whose fees will be withdrawn and transferred to.
     * @param token The address of specified ERC20 token.
     *
     * Emits a {Refunded} event.
     */
    function refund(
        address payee,
        address token
    ) public virtual onlyOwner {
        IERC20(token).transfer(payee, escrowBalance[payee][token]);
        escrowBalance[payee][token] = 0;

        emit Refunded(payee, token, escrowCommissionBalance[token]);
    }

    /**
     * @dev Stores the sent amount as credit to be withdrawn.
     * 
     * @param payee The source address of the funds.
     * @param token The address of specified ERC20 token.
     *
     * Emits a {Deposited} event.
     */
    function withdrawFee(
        address payee,
        address token
    ) public virtual onlyOwner {
        IERC20(token).transfer(payee, escrowCommissionBalance[token]);
        escrowCommissionBalance[token] = 0;

        emit WithdrawnFee(payee, token, escrowCommissionBalance[token]);
    }
}
