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
[RWATokenizer1155._update(address,address,uint256[],uint256[])](contracts/RWATokenizer1155.sol#L371-L397) ignores return value by [_supplyHistory[id].push(now_,SafeCast.toUint208(totalSupply(id)))](contracts/RWATokenizer1155.sol#L392)

contracts/RWATokenizer1155.sol#L371-L397


 - [ ] ID-1
[RWATokenizer1155._update(address,address,uint256[],uint256[])](contracts/RWATokenizer1155.sol#L371-L397) ignores return value by [_balanceHistory[id][to].push(now_,SafeCast.toUint208(balanceOf(to,id)))](contracts/RWATokenizer1155.sol#L391)

contracts/RWATokenizer1155.sol#L371-L397


 - [ ] ID-2
[RWATokenizer1155._update(address,address,uint256[],uint256[])](contracts/RWATokenizer1155.sol#L371-L397) ignores return value by [_balanceHistory[id][from].push(now_,SafeCast.toUint208(balanceOf(from,id)))](contracts/RWATokenizer1155.sol#L390)

contracts/RWATokenizer1155.sol#L371-L397


## timestamp
Impact: Low
Confidence: Medium
 - [ ] ID-3
[RWATokenizer1155.balanceOfAt(address,uint256,uint48)](contracts/RWATokenizer1155.sol#L301-L304) uses timestamp for comparisons
	Dangerous comparisons:
	- [timepoint >= block.timestamp](contracts/RWATokenizer1155.sol#L302)

contracts/RWATokenizer1155.sol#L301-L304


 - [ ] ID-4
[RWATokenizer1155.totalSupplyAt(uint256,uint48)](contracts/RWATokenizer1155.sol#L307-L310) uses timestamp for comparisons
	Dangerous comparisons:
	- [timepoint >= block.timestamp](contracts/RWATokenizer1155.sol#L308)

contracts/RWATokenizer1155.sol#L307-L310


## naming-convention
Impact: Informational
Confidence: High
 - [ ] ID-5
Function [AssetVotes.CLOCK_MODE()](contracts/governance/AssetVotes.sol#L52-L54) is not in mixedCase

contracts/governance/AssetVotes.sol#L52-L54


## unimplemented-functions
Impact: Informational
Confidence: High
 - [ ] ID-6
[RWATokenizer1155](contracts/RWATokenizer1155.sol#L31-L421) does not implement functions:
	- [IRWATokenizer.balanceOf(address,uint256)](contracts/interfaces/IRWATokenizer.sol#L13)

contracts/RWATokenizer1155.sol#L31-L421


