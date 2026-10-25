// Generado por scripts/export-abis.mjs. No editar a mano.
export const AssetVotesAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "tokenizer_",
        "type": "address",
        "internalType": "contract IRWATokenizer"
      },
      {
        "name": "assetId_",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "CLOCK_MODE",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "assetId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "clock",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint48",
        "internalType": "uint48"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "delegate",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "delegateBySig",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "delegates",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "getPastTotalSupply",
    "inputs": [
      {
        "name": "timepoint",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getPastVotes",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "timepoint",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getVotes",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenizer",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IRWATokenizer"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "DelegateChanged",
    "inputs": [
      {
        "name": "delegator",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "fromDelegate",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "toDelegate",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DelegateVotesChanged",
    "inputs": [
      {
        "name": "delegate",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "previousVotes",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newVotes",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "DelegationDisabled",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ERC5805FutureLookup",
    "inputs": [
      {
        "name": "timepoint",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "clock",
        "type": "uint48",
        "internalType": "uint48"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidAssetId",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SafeCastOverflowedUintDowncast",
    "inputs": [
      {
        "name": "bits",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "value",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "VotesExpiredSignature",
    "inputs": [
      {
        "name": "expiry",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "ZeroAddress",
    "inputs": []
  }
] as const;

export const AssetVotesBytecode = "0x60c060405234801561000f575f80fd5b5060405161075538038061075583398101604081905261002e9161008b565b6001600160a01b0382166100555760405163d92e233d60e01b815260040160405180910390fd5b805f03610075576040516307d7e52d60e51b815260040160405180910390fd5b6001600160a01b0390911660805260a0526100c2565b5f806040838503121561009c575f80fd5b82516001600160a01b03811681146100b2575f80fd5b6020939093015192949293505050565b60805160a05161064961010c5f395f818160ca01528181610207015281816102fe01526103be01525f81816101b2015281816101d7015281816102cf01526103e601526106495ff3fe608060405234801561000f575f80fd5b506004361061009b575f3560e01c80638e539e8c116100635780638e539e8c1461015a57806391ddadf41461016d5780639ab24eb01461018c578063c3cda5201461019f578063f0d26e1c146101ad575f80fd5b80633a46b1a81461009f57806344de240a146100c55780634bf5d7e9146100ec578063587cde1e1461011c5780635c19a95c14610145575b5f80fd5b6100b26100ad3660046104de565b6101d4565b6040519081526020015b60405180910390f35b6100b27f000000000000000000000000000000000000000000000000000000000000000081565b604080518082018252600e81526d06d6f64653d74696d657374616d760941b602082015290516100bc9190610506565b61012d61012a366004610552565b90565b6040516001600160a01b0390911681526020016100bc565b610158610153366004610552565b6102b3565b005b6100b261016836600461056b565b6102cc565b610175610392565b60405165ffffffffffff90911681526020016100bc565b6100b261019a366004610552565b6103a0565b610158610153366004610582565b61012d7f000000000000000000000000000000000000000000000000000000000000000081565b5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316633e047d4b847f000000000000000000000000000000000000000000000000000000000000000061022f86610416565b6040516001600160e01b031960e086901b1681526001600160a01b039093166004840152602483019190915265ffffffffffff166044820152606401602060405180830381865afa158015610286573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906102aa91906105dd565b90505b92915050565b604051634a8489c560e01b815260040160405180910390fd5b5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b031663abbabe2a7f000000000000000000000000000000000000000000000000000000000000000061032685610416565b6040516001600160e01b031960e085901b168152600481019290925265ffffffffffff1660248201526044015b602060405180830381865afa15801561036e573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906102ad91906105dd565b5f61039b610487565b905090565b604051627eeac760e11b81526001600160a01b0382811660048301527f000000000000000000000000000000000000000000000000000000000000000060248301525f917f00000000000000000000000000000000000000000000000000000000000000009091169062fdd58e90604401610353565b5f80610420610392565b90508065ffffffffffff16831061046057604051637669fc0f60e11b81526004810184905265ffffffffffff821660248201526044015b60405180910390fd5b821561047e576104796104746001856105f4565b61048d565b610480565b5f5b9392505050565b5f61039b425b5f65ffffffffffff8211156104bf576040516306dfcc6560e41b81526030600482015260248101839052604401610457565b5090565b80356001600160a01b03811681146104d9575f80fd5b919050565b5f80604083850312156104ef575f80fd5b6104f8836104c3565b946020939093013593505050565b5f602080835283518060208501525f5b8181101561053257858101830151858201604001528201610516565b505f604082860101526040601f19601f8301168501019250505092915050565b5f60208284031215610562575f80fd5b6102aa826104c3565b5f6020828403121561057b575f80fd5b5035919050565b5f805f805f8060c08789031215610597575f80fd5b6105a0876104c3565b95506020870135945060408701359350606087013560ff811681146105c3575f80fd5b9598949750929560808101359460a0909101359350915050565b5f602082840312156105ed575f80fd5b5051919050565b818103818111156102ad57634e487b7160e01b5f52601160045260245ffdfea2646970667358221220508258adbb9a9ee5bf98bb22fd7813030e6730c6e9d21e5841663a1e18c53c9e64736f6c63430008180033" as const;
