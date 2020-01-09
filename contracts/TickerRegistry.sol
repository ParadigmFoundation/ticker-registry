pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/access/roles/WhitelistAdminRole.sol";

contract TickerRegistry is WhitelistAdminRole, Ownable {

    mapping(address => string) tokenTickers;
    mapping(string => address) tickerAddresses;
    string[] trackedTickers;

    struct TickerOverride {
        string ticker;
        address tokenAddress;
    }

    constructor(address[] memory whitelist, TickerOverride[] memory overrides) public {
        for(uint i = 0; i < whitelist.length; i++) {
            addWhitelistAdmin(whitelist[i]);
        }

        for(uint i = 0; i < overrides.length; i++) {
            overrideTicker(overrides[i].ticker, overrides[i].tokenAddress);
        }
    }

    function listTrackedTickers() public view returns (string[] memory) {
        return trackedTickers;
    }

    function tickerForAddress(address a) public view returns (string memory) {
        return tokenTickers[a];
    }

    function addressForTicker(string memory t) public view returns (address) {
        return tickerAddresses[t];
    }

    function overrideTicker(string memory ticker, address tokenAddress) onlyWhitelistAdmin public {
        _update(ticker, tokenAddress);
    }

    function registerTicker(address tokenAddress) public {
        require(_tokenTickerEmpty(tokenAddress), "Token already been registered.");
        string memory ticker = ERC20Detailed(tokenAddress).symbol();
        require(_tickerAddressEmpty(ticker), "Ticker in use.");
        _update(ticker, tokenAddress);
    }

    function removeWhitelistAdmin(address account) public onlyOwner {
        _removeWhitelistAdmin(account);
    }

    function _update(string memory ticker, address tokenAddress) internal {
        if (!_tickerAddressEmpty(ticker)) {
            tokenTickers[tickerAddresses[ticker]] = ""; // If ticker previously existed set address ticker to empty string
        } else {
            trackedTickers.push(ticker);
        }

        if (!_tokenTickerEmpty(tokenAddress)) {
            string memory current = tokenTickers[tokenAddress];
            tickerAddresses[current] = address(0x0);
            uint ttl = trackedTickers.length;
            for(uint i = 0; i < ttl; i++) {
                if(_stringsMatch(current, trackedTickers[i])) {
                    trackedTickers[i] = trackedTickers[ttl - 1];
                    trackedTickers.length = ttl - 1;
                    break;
                }
            }
        }

        tickerAddresses[ticker] = tokenAddress;
        tokenTickers[tokenAddress] = ticker;
    }

    function _tokenTickerEmpty(address a) internal view returns (bool) {
        return _stringsMatch(tokenTickers[a], "");
    }

    function _tickerAddressEmpty(string memory ticker) internal view returns (bool) {
        return tickerAddresses[ticker] == address(0x0);
    }

    function _stringsMatch(string memory s1, string memory s2) pure internal returns (bool) {
        return keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
    }
}