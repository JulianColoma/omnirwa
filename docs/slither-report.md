**THIS CHECKLIST IS NOT COMPLETE**. Use `--show-ignored-findings` to show all the results.
Summary
 - [unused-return](#unused-return) (3 results) (Medium)
 - [timestamp](#timestamp) (2 results) (Low)
 - [naming-convention](#naming-convention) (1 results) (Informational)
 - [unimplemented-functions](#unimplemented-functions) (1 results) (Informational)
## unused-return
Impact: Medium
Confidence: Medium
 - [ ] ID-0
[RWATokenizer1155._update(address,address,uint256[],uint256[])](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L384-L410) ignores return value by [_balanceHistory[id][to].push(now_,SafeCast.toUint208(balanceOf(to,id)))](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L404)

https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L384-L410


 - [ ] ID-1
[RWATokenizer1155._update(address,address,uint256[],uint256[])](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L384-L410) ignores return value by [_supplyHistory[id].push(now_,SafeCast.toUint208(totalSupply(id)))](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L405)

https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L384-L410


 - [ ] ID-2
[RWATokenizer1155._update(address,address,uint256[],uint256[])](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L384-L410) ignores return value by [_balanceHistory[id][from].push(now_,SafeCast.toUint208(balanceOf(from,id)))](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L403)

https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L384-L410


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-3
[RWATokenizer1155.balanceOfAt(address,uint256,uint48)](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L314-L317) uses timestamp for comparisons
	Dangerous comparisons:
	- [timepoint >= block.timestamp](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L315)

https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L314-L317


 - [ ] ID-4
[RWATokenizer1155.totalSupplyAt(uint256,uint48)](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L320-L323) uses timestamp for comparisons
	Dangerous comparisons:
	- [timepoint >= block.timestamp](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L321)

https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L320-L323


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-5
Function [AssetVotes.CLOCK_MODE()](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/governance/AssetVotes.sol#L52-L54) is not in mixedCase

https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/governance/AssetVotes.sol#L52-L54


## unimplemented-functions
Impact: Informational
Confidence: High
 - [ ] ID-6
[RWATokenizer1155](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L31-L434) does not implement functions:
	- [IRWATokenizer.balanceOf(address,uint256)](https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/interfaces/IRWATokenizer.sol#L13)

https://github.com/JulianColoma/omnirwa/blob/b242d0f/contracts/RWATokenizer1155.sol#L31-L434


