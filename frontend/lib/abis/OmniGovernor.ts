// Generado por scripts/export-abis.mjs. No editar a mano.
export const OmniGovernorAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "votes",
        "type": "address",
        "internalType": "contract IVotes"
      },
      {
        "name": "name_",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "votingPeriod_",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "receive",
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "BALLOT_TYPEHASH",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
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
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "COUNTING_MODE",
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
    "name": "EXTENDED_BALLOT_TYPEHASH",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "SUPERMAJORITY_DENOMINATOR",
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
    "name": "SUPERMAJORITY_NUMERATOR",
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
    "name": "cancel",
    "inputs": [
      {
        "name": "targets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "values",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "calldatas",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "descriptionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "castVote",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "support",
        "type": "uint8",
        "internalType": "uint8"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "castVoteBySig",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "support",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "voter",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "signature",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "castVoteWithReason",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "support",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "reason",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "castVoteWithReasonAndParams",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "support",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "reason",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "params",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "castVoteWithReasonAndParamsBySig",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "support",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "voter",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "reason",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "params",
        "type": "bytes",
        "internalType": "bytes"
      },
      {
        "name": "signature",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
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
    "name": "eip712Domain",
    "inputs": [],
    "outputs": [
      {
        "name": "fields",
        "type": "bytes1",
        "internalType": "bytes1"
      },
      {
        "name": "name",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "version",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "chainId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "verifyingContract",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "salt",
        "type": "bytes32",
        "internalType": "bytes32"
      },
      {
        "name": "extensions",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "execute",
    "inputs": [
      {
        "name": "targets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "values",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "calldatas",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "descriptionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "getVotes",
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
    "name": "getVotesWithParams",
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
      },
      {
        "name": "params",
        "type": "bytes",
        "internalType": "bytes"
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
    "name": "hasVoted",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hashProposal",
    "inputs": [
      {
        "name": "targets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "values",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "calldatas",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "descriptionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "pure"
  },
  {
    "type": "function",
    "name": "name",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nonces",
    "inputs": [
      {
        "name": "owner",
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
    "name": "onERC1155BatchReceived",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "onERC1155Received",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
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
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "onERC721Received",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
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
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "proposalDeadline",
    "inputs": [
      {
        "name": "proposalId",
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
    "name": "proposalEta",
    "inputs": [
      {
        "name": "proposalId",
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
    "name": "proposalNeedsQueuing",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalProposer",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalSnapshot",
    "inputs": [
      {
        "name": "proposalId",
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
    "name": "proposalThreshold",
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
    "name": "proposalVotes",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "againstVotes",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "forVotes",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "abstainVotes",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "propose",
    "inputs": [
      {
        "name": "targets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "values",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "calldatas",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "description",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "queue",
    "inputs": [
      {
        "name": "targets",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "values",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "calldatas",
        "type": "bytes[]",
        "internalType": "bytes[]"
      },
      {
        "name": "descriptionHash",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "quorum",
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
    "name": "quorumDenominator",
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
    "name": "quorumNumerator",
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
    "name": "quorumNumerator",
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
    "name": "relay",
    "inputs": [
      {
        "name": "target",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "value",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "data",
        "type": "bytes",
        "internalType": "bytes"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "setProposalThreshold",
    "inputs": [
      {
        "name": "newProposalThreshold",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setVotingDelay",
    "inputs": [
      {
        "name": "newVotingDelay",
        "type": "uint48",
        "internalType": "uint48"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setVotingPeriod",
    "inputs": [
      {
        "name": "newVotingPeriod",
        "type": "uint32",
        "internalType": "uint32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "state",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint8",
        "internalType": "enum IGovernor.ProposalState"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "supportsInterface",
    "inputs": [
      {
        "name": "interfaceId",
        "type": "bytes4",
        "internalType": "bytes4"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "token",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC5805"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "updateQuorumNumerator",
    "inputs": [
      {
        "name": "newQuorumNumerator",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "version",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "string",
        "internalType": "string"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "votingDelay",
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
    "name": "votingPeriod",
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
    "type": "event",
    "name": "EIP712DomainChanged",
    "inputs": [],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalCanceled",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalCreated",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "proposer",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "targets",
        "type": "address[]",
        "indexed": false,
        "internalType": "address[]"
      },
      {
        "name": "values",
        "type": "uint256[]",
        "indexed": false,
        "internalType": "uint256[]"
      },
      {
        "name": "signatures",
        "type": "string[]",
        "indexed": false,
        "internalType": "string[]"
      },
      {
        "name": "calldatas",
        "type": "bytes[]",
        "indexed": false,
        "internalType": "bytes[]"
      },
      {
        "name": "voteStart",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "voteEnd",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "description",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalExecuted",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalQueued",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "etaSeconds",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalThresholdSet",
    "inputs": [
      {
        "name": "oldProposalThreshold",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newProposalThreshold",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "QuorumNumeratorUpdated",
    "inputs": [
      {
        "name": "oldQuorumNumerator",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newQuorumNumerator",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VoteCast",
    "inputs": [
      {
        "name": "voter",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "support",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "weight",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "reason",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VoteCastWithParams",
    "inputs": [
      {
        "name": "voter",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "support",
        "type": "uint8",
        "indexed": false,
        "internalType": "uint8"
      },
      {
        "name": "weight",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "reason",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "params",
        "type": "bytes",
        "indexed": false,
        "internalType": "bytes"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VotingDelaySet",
    "inputs": [
      {
        "name": "oldVotingDelay",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newVotingDelay",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "VotingPeriodSet",
    "inputs": [
      {
        "name": "oldVotingPeriod",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "newVotingPeriod",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "CheckpointUnorderedInsertion",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FailedCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GovernorAlreadyCastVote",
    "inputs": [
      {
        "name": "voter",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorAlreadyQueuedProposal",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorDisabledDeposit",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GovernorInsufficientProposerVotes",
    "inputs": [
      {
        "name": "proposer",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "votes",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "threshold",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorInvalidProposalLength",
    "inputs": [
      {
        "name": "targets",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "calldatas",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "values",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorInvalidQuorumFraction",
    "inputs": [
      {
        "name": "quorumNumerator",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "quorumDenominator",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorInvalidSignature",
    "inputs": [
      {
        "name": "voter",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorInvalidVoteParams",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GovernorInvalidVoteType",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GovernorInvalidVotingPeriod",
    "inputs": [
      {
        "name": "votingPeriod",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorNonexistentProposal",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorNotQueuedProposal",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorOnlyExecutor",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorOnlyProposer",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorQueueNotImplemented",
    "inputs": []
  },
  {
    "type": "error",
    "name": "GovernorRestrictedProposer",
    "inputs": [
      {
        "name": "proposer",
        "type": "address",
        "internalType": "address"
      }
    ]
  },
  {
    "type": "error",
    "name": "GovernorUnexpectedProposalState",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "current",
        "type": "uint8",
        "internalType": "enum IGovernor.ProposalState"
      },
      {
        "name": "expectedStates",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidAccountNonce",
    "inputs": [
      {
        "name": "account",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "currentNonce",
        "type": "uint256",
        "internalType": "uint256"
      }
    ]
  },
  {
    "type": "error",
    "name": "InvalidShortString",
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
    "name": "StringTooLong",
    "inputs": [
      {
        "name": "str",
        "type": "string",
        "internalType": "string"
      }
    ]
  },
  {
    "type": "error",
    "name": "ZeroAddress",
    "inputs": []
  }
] as const;

export const OmniGovernorBytecode = "0x61018060405234801562000011575f80fd5b50604051620045093803806200450983398101604081905262000034916200072d565b6014620000418462000170565b5f8360018680620000666040805180820190915260018152603160f81b602082015290565b62000072825f6200019d565b61012052620000838160016200019d565b61014052815160208084019190912060e052815190820120610100524660a0526200011060e05161010051604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201529081019290925260608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b60805250503060c05260036200012782826200089d565b5062000135905083620001d5565b62000140826200023b565b6200014b81620002e0565b5050506001600160a01b031661016052620001668162000321565b5050505062000a08565b5f6001600160a01b038216620001995760405163d92e233d60e01b815260040160405180910390fd5b5090565b5f602083511015620001bc57620001b483620003c0565b9050620001cf565b81620001c984826200089d565b5060ff90505b92915050565b6008546040805165ffffffffffff928316815291831660208301527fc565b045403dc03c2eea82b81a0465edad9e2e7fc4d97e11421c209da93d7a93910160405180910390a16008805465ffffffffffff191665ffffffffffff92909216919091179055565b8063ffffffff165f03620002695760405163f1cfbf0560e01b81525f60048201526024015b60405180910390fd5b6008546040805163ffffffff66010000000000009093048316815291831660208301527f7e3f7f0708a84de9203036abaa450dccc85ad5ff52f78c170f3edb55cf5e8828910160405180910390a16008805463ffffffff90921666010000000000000263ffffffff60301b19909216919091179055565b60075460408051918252602082018390527fccb45da8d5717e6c4544694297c4ba5cf151d455c9bb0ed4fc7a38411bc05461910160405180910390a1600755565b606480821115620003505760405163243e544560e01b8152600481018390526024810182905260440162000260565b5f6200035b62000402565b9050620003806200036b6200041d565b62000376856200049e565b600a9190620004d3565b505060408051828152602081018590527f0553476bf02ef2726e8ce5ced78d63e26e602e4a2257b1f559418e24b4633997910160405180910390a1505050565b5f80829050601f81511115620003ed578260405163305a27a960e01b815260040162000260919062000969565b8051620003fa826200099d565b179392505050565b5f6200040f600a620004ef565b6001600160d01b0316905090565b5f620004296101605190565b6001600160a01b03166391ddadf46040518163ffffffff1660e01b8152600401602060405180830381865afa92505050801562000485575060408051601f3d908101601f191682019092526200048291810190620009c1565b60015b6200049957620004946200053c565b905090565b919050565b5f6001600160d01b0382111562000199576040516306dfcc6560e41b815260d060048201526024810183905260440162000260565b5f80620004e285858562000548565b915091505b935093915050565b80545f908015620005335762000519836200050c600184620009e8565b5f91825260209091200190565b54660100000000000090046001600160d01b031662000535565b5f5b9392505050565b5f6200049443620006ad565b82545f90819080156200064f575f62000568876200050c600185620009e8565b805490915065ffffffffffff80821691660100000000000090046001600160d01b0316908816821115620005af57604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff1603620005ed57825465ffffffffffff1666010000000000006001600160d01b0389160217835562000640565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f815291909120945191519092166601000000000000029216919091179101555b9450859350620004e792505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a8152918220955192519093166601000000000000029190931617920191909155905081620004e7565b5f65ffffffffffff82111562000199576040516306dfcc6560e41b8152603060048201526024810183905260440162000260565b634e487b7160e01b5f52604160045260245ffd5b5f5b8381101562000711578181015183820152602001620006f7565b50505f910152565b805163ffffffff8116811462000499575f80fd5b5f805f6060848603121562000740575f80fd5b83516001600160a01b038116811462000757575f80fd5b60208501519093506001600160401b038082111562000774575f80fd5b818601915086601f83011262000788575f80fd5b8151818111156200079d576200079d620006e1565b604051601f8201601f19908116603f01168101908382118183101715620007c857620007c8620006e1565b81604052828152896020848701011115620007e1575f80fd5b620007f4836020830160208801620006f5565b80965050505050506200080a6040850162000719565b90509250925092565b600181811c908216806200082857607f821691505b6020821081036200084757634e487b7160e01b5f52602260045260245ffd5b50919050565b601f8211156200089857805f5260205f20601f840160051c81016020851015620008745750805b601f840160051c820191505b8181101562000895575f815560010162000880565b50505b505050565b81516001600160401b03811115620008b957620008b9620006e1565b620008d181620008ca845462000813565b846200084d565b602080601f83116001811462000907575f8415620008ef5750858301515b5f19600386901b1c1916600185901b17855562000961565b5f85815260208120601f198616915b82811015620009375788860151825594840194600190910190840162000916565b50858210156200095557878501515f19600388901b60f8161c191681555b505060018460011b0185555b505050505050565b602081525f825180602084015262000989816040850160208701620006f5565b601f01601f19169190910160400192915050565b8051602080830151919081101562000847575f1960209190910360031b1b16919050565b5f60208284031215620009d2575f80fd5b815165ffffffffffff8116811462000535575f80fd5b81810381811115620001cf57634e487b7160e01b5f52601160045260245ffd5b60805160a05160c05160e05161010051610120516101405161016051613a8962000a805f395f818161098201528181610dd10152818161131001528181611ef601526120e001525f611ec301525f611e9701525f61230101525f6122d901525f61223401525f61225e01525f6122880152613a895ff3fe60806040526004361061028e575f3560e01c80637ecebe0011610155578063c01f9e37116100be578063e540d01d11610078578063e540d01d146108cd578063eb9019d4146108ec578063ece40cc11461090b578063f23a6e611461092a578063f8ce560a14610955578063fc0c546a14610974575f80fd5b8063c01f9e37146107f0578063c28bc2fa1461080f578063c59057e414610822578063dd4e2ba514610841578063deaaa7cc14610886578063dfc64cd6146108b9575f80fd5b8063a7713a701161010f578063a7713a7014610734578063a9a9529414610748578063ab58fb8e14610767578063b33222871461079d578063b58131b0146107b1578063bc197c81146107c5575f80fd5b80637ecebe001461065d57806384b0196e146106915780638ff262e3146106b857806391ddadf4146106d757806397c3d334146107025780639a802a6d14610715575f80fd5b806343859632116101f75780635b8d0e0d116101b15780635b8d0e0d146105a35780635f398a14146105c257806360c4247f146105e157806379051887146106005780637b3c71d31461061f5780637d5e81e21461063e575f80fd5b8063438596321461048d578063452115d6146104d55780634bf5d7e9146104f4578063544ffc9c1461050857806354fd4d501461055b5780635678138814610584575f80fd5b8063160cbed711610248578063160cbed7146103c95780632656227d146103e85780632d63f693146103fb5780632fe3e2611461041a5780633932abb11461044d5780633e4f49e614610461575f80fd5b806301ffc9a71461029b57806302a251a3146102cf57806306f3f9e6146102fa57806306fdde0314610319578063143489d01461033a578063150b7a0214610386575f80fd5b3661029757005b005b5f80fd5b3480156102a6575f80fd5b506102ba6102b5366004612b4b565b6109a6565b60405190151581526020015b60405180910390f35b3480156102da575f80fd5b50600854600160301b900463ffffffff165b6040519081526020016102c6565b348015610305575f80fd5b50610295610314366004612b72565b6109fc565b348015610324575f80fd5b5061032d610a10565b6040516102c69190612bd6565b348015610345575f80fd5b5061036e610354366004612b72565b5f908152600460205260409020546001600160a01b031690565b6040516001600160a01b0390911681526020016102c6565b348015610391575f80fd5b506103b06103a0366004612cc1565b630a85bd0160e11b949350505050565b6040516001600160e01b031990911681526020016102c6565b3480156103d4575f80fd5b506102ec6103e3366004612e8a565b610aa0565b6102ec6103f6366004612e8a565b610ade565b348015610406575f80fd5b506102ec610415366004612b72565b610c06565b348015610425575f80fd5b506102ec7f3e83946653575f9a39005e1545185629e92736b7528ab20ca3816f315424a81181565b348015610458575f80fd5b506102ec610c26565b34801561046c575f80fd5b5061048061047b366004612b72565b610c38565b6040516102c69190612f47565b348015610498575f80fd5b506102ba6104a7366004612f55565b5f8281526009602090815260408083206001600160a01b038516845260030190915290205460ff1692915050565b3480156104e0575f80fd5b506102ec6104ef366004612e8a565b610d61565b3480156104ff575f80fd5b5061032d610dcd565b348015610513575f80fd5b50610540610522366004612b72565b5f908152600960205260409020805460018201546002909201549092565b604080519384526020840192909252908201526060016102c6565b348015610566575f80fd5b506040805180820190915260018152603160f81b602082015261032d565b34801561058f575f80fd5b506102ec61059e366004612f8f565b610e8d565b3480156105ae575f80fd5b506102ec6105bd366004612ff4565b610eb4565b3480156105cd575f80fd5b506102ec6105dc3660046130a4565b611010565b3480156105ec575f80fd5b506102ec6105fb366004612b72565b611063565b34801561060b575f80fd5b5061029561061a366004613134565b6110ef565b34801561062a575f80fd5b506102ec61063936600461314f565b611100565b348015610649575f80fd5b506102ec6106583660046131a4565b611146565b348015610668575f80fd5b506102ec610677366004613250565b6001600160a01b03165f9081526002602052604090205490565b34801561069c575f80fd5b506106a56111fc565b6040516102c697969594939291906132a3565b3480156106c3575f80fd5b506102ec6106d2366004613312565b61123e565b3480156106e2575f80fd5b506106eb61130d565b60405165ffffffffffff90911681526020016102c6565b34801561070d575f80fd5b5060646102ec565b348015610720575f80fd5b506102ec61072f36600461335d565b611394565b34801561073f575f80fd5b506102ec6113aa565b348015610753575f80fd5b506102ba610762366004612b72565b505f90565b348015610772575f80fd5b506102ec610781366004612b72565b5f9081526004602052604090206001015465ffffffffffff1690565b3480156107a8575f80fd5b506102ec600381565b3480156107bc575f80fd5b506102ec6113c3565b3480156107d0575f80fd5b506103b06107df3660046133af565b63bc197c8160e01b95945050505050565b3480156107fb575f80fd5b506102ec61080a366004612b72565b6113cd565b61029561081d366004613437565b61140f565b34801561082d575f80fd5b506102ec61083c366004612e8a565b61148b565b34801561084c575f80fd5b506040805180820190915260208082527f737570706f72743d627261766f2671756f72756d3d666f722c6162737461696e9082015261032d565b348015610891575f80fd5b506102ec7ff2aad550cf55f045cb27e9c559f9889fdfb6e6cdaa032301d6ea397784ae51d781565b3480156108c4575f80fd5b506102ec600281565b3480156108d8575f80fd5b506102956108e7366004613474565b6114c4565b3480156108f7575f80fd5b506102ec610906366004613497565b6114d5565b348015610916575f80fd5b50610295610925366004612b72565b6114f4565b348015610935575f80fd5b506103b06109443660046134bf565b63f23a6e6160e01b95945050505050565b348015610960575f80fd5b506102ec61096f366004612b72565b611505565b34801561097f575f80fd5b507f000000000000000000000000000000000000000000000000000000000000000061036e565b5f6001600160e01b031982166332a2ad4360e11b14806109d657506001600160e01b03198216630271189760e51b145b806109f157506301ffc9a760e01b6001600160e01b03198316145b92915050565b905090565b610a0461150f565b610a0d81611546565b50565b606060038054610a1f9061351e565b80601f0160208091040260200160405190810160405280929190818152602001828054610a4b9061351e565b8015610a965780601f10610a6d57610100808354040283529160200191610a96565b820191905f5260205f20905b815481529060010190602001808311610a7957829003601f168201915b5050505050905090565b5f80610aae8686868661148b565b9050610ac381610abe60046115db565b6115fd565b505f604051634844252360e11b815260040160405180910390fd5b5f80610aec8686868661148b565b9050610b0c81610afc60056115db565b610b0660046115db565b176115fd565b505f818152600460205260409020805460ff60f01b1916600160f01b17905530610b333090565b6001600160a01b031614610bbc575f5b8651811015610bba57306001600160a01b0316878281518110610b6857610b68613556565b60200260200101516001600160a01b031603610bb257610bb2858281518110610b9357610b93613556565b602002602001015180519060200120600561163a90919063ffffffff16565b600101610b43565b505b610bc9818787878761169b565b6040518181527f712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f906020015b60405180910390a195945050505050565b5f90815260046020526040902054600160a01b900465ffffffffffff1690565b5f6109f760085465ffffffffffff1690565b5f818152600460205260408120805460ff600160f01b8204811691600160f81b9004168115610c6c57506007949350505050565b8015610c7d57506002949350505050565b5f610c8786610c06565b9050805f03610cb157604051636ad0607560e01b8152600481018790526024015b60405180910390fd5b5f610cba61130d565b65ffffffffffff169050808210610cd757505f9695505050505050565b5f610ce1886113cd565b9050818110610cf857506001979650505050505050565b610d0188611770565b1580610d135750610d11886117a6565b155b15610d2657506003979650505050505050565b5f8881526004602052604090206001015465ffffffffffff165f03610d5357506004979650505050505050565b506005979650505050505050565b5f80610d6f8686868661148b565b9050610d7e81610abe5f6115db565b505f818152600460205260409020546001600160a01b03163314610db75760405163233d98e360e01b8152336004820152602401610ca8565b610dc3868686866117f0565b9695505050505050565b60607f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316634bf5d7e96040518163ffffffff1660e01b81526004015f60405180830381865afa925050508015610e4c57506040513d5f823e601f3d908101601f19168201604052610e49919081019061356a565b60015b610e88575060408051808201909152601d81527f6d6f64653d626c6f636b6e756d6265722666726f6d3d64656661756c74000000602082015290565b919050565b5f80339050610eac84828560405180602001604052805f81525061189f565b949350505050565b5f80610f9587610f8f7f3e83946653575f9a39005e1545185629e92736b7528ab20ca3816f315424a8118c8c8c610f078e6001600160a01b03165f90815260026020526040902080546001810190915590565b8d8d604051610f179291906135d2565b60405180910390208c80519060200120604051602001610f749796959493929190968752602087019590955260ff9390931660408601526001600160a01b03919091166060850152608084015260a083015260c082015260e00190565b604051602081830303815290604052805190602001206118c9565b856118f5565b905080610fc0576040516394ab6c0760e01b81526001600160a01b0388166004820152602401610ca8565b61100389888a89898080601f0160208091040260200160405190810160405280939291908181526020018383808284375f920191909152508b9250611965915050565b9998505050505050505050565b5f8033905061105887828888888080601f0160208091040260200160405190810160405280939291908181526020018383808284375f920191909152508a9250611965915050565b979650505050505050565b600a80545f9182906110766001846135f5565b8154811061108657611086613556565b5f918252602090912001805490915065ffffffffffff811690600160301b90046001600160d01b03168582116110c8576001600160d01b031695945050505050565b6110dc6110d487611a43565b600a90611a79565b6001600160d01b03169695505050505050565b6110f761150f565b610a0d81611b28565b5f80339050610dc386828787878080601f0160208091040260200160405190810160405280939291908181526020018383808284375f9201919091525061189f92505050565b5f336111528184611b8e565b61117a5760405163d9b3955760e01b81526001600160a01b0382166004820152602401610ca8565b5f6111836113c3565b905080156111ef575f6111b183600161119a61130d565b6111a49190613608565b65ffffffffffff166114d5565b9050818110156111ed57604051636121770b60e11b81526001600160a01b03841660048201526024810182905260448101839052606401610ca8565b505b6110588787878786611c76565b5f6060805f805f606061120d611e90565b611215611ebc565b604080515f80825260208201909252600f60f81b9b939a50919850469750309650945092509050565b5f806112c884610f8f7ff2aad550cf55f045cb27e9c559f9889fdfb6e6cdaa032301d6ea397784ae51d78989896112918b6001600160a01b03165f90815260026020526040902080546001810190915590565b60408051602081019690965285019390935260ff90911660608401526001600160a01b0316608083015260a082015260c001610f74565b9050806112f3576040516394ab6c0760e01b81526001600160a01b0385166004820152602401610ca8565b610dc386858760405180602001604052805f81525061189f565b5f7f00000000000000000000000000000000000000000000000000000000000000006001600160a01b03166391ddadf46040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015611388575060408051601f3d908101601f191682019092526113859181019061362e565b60015b610e88576109f7611ee9565b5f6113a0848484611ef3565b90505b9392505050565b5f6113b5600a611f86565b6001600160d01b0316905090565b5f6109f760075490565b5f8181526004602052604081205461140190600160d01b810463ffffffff1690600160a01b900465ffffffffffff16613649565b65ffffffffffff1692915050565b61141761150f565b5f80856001600160a01b03168585856040516114349291906135d2565b5f6040518083038185875af1925050503d805f811461146e576040519150601f19603f3d011682016040523d82523d5f602084013e611473565b606091505b50915091506114828282611fbd565b50505050505050565b5f848484846040516020016114a394939291906136f8565b60408051601f19818403018152919052805160209091012095945050505050565b6114cc61150f565b610a0d81611fd9565b5f6113a383836114ef60408051602081019091525f815290565b611ef3565b6114fc61150f565b610a0d81612075565b5f6109f1826120b6565b303314611531576040516347096e4760e01b8152336004820152602401610ca8565b565b8061153e600561215d565b036115335750565b6064808211156115735760405163243e544560e01b81526004810183905260248101829052604401610ca8565b5f61157c6113aa565b905061159b61158961130d565b611592856121ca565b600a91906121fd565b505060408051828152602081018590527f0553476bf02ef2726e8ce5ced78d63e26e602e4a2257b1f559418e24b4633997910160405180910390a1505050565b5f8160078111156115ee576115ee612f13565b600160ff919091161b92915050565b5f8061160884610c38565b90505f83611615836115db565b16036113a3578381846040516331b75e4d60e01b8152600401610ca893929190613742565b81546001600160801b03600160801b820481169181166001830190911603611666576116666041612217565b6001600160801b038082165f90815260018086016020526040909120939093558354919092018216600160801b029116179055565b5f5b8451811015611768575f808683815181106116ba576116ba613556565b60200260200101516001600160a01b03168684815181106116dd576116dd613556565b60200260200101518685815181106116f7576116f7613556565b602002602001015160405161170c9190613764565b5f6040518083038185875af1925050503d805f8114611746576040519150601f19603f3d011682016040523d82523d5f602084013e61174b565b606091505b509150915061175a8282611fbd565b50505080600101905061169d565b505050505050565b5f81815260096020526040812060028101546001820154611791919061377f565b61179d61096f85610c06565b11159392505050565b5f81815260096020526040812080546001909101548015801590610eac575060026117d1838361377f565b6117db9190613792565b6117e6600383613792565b1015949350505050565b5f806117fe8686868661148b565b905061184c8161180e60076115db565b61181860066115db565b61182260026115db565b600161182f6007826137a9565b61183a9060026138a2565b61184491906135f5565b1818186115fd565b505f818152600460205260409081902080546001600160f81b0316600160f81b179055517f789cf55be980739dad1d0699b93b58e806b51c9d96619bfa8fe0a28abaa7b30c90610bf59083815260200190565b5f6118c0858585856118bb60408051602081019091525f815290565b611965565b95945050505050565b5f6109f16118d5612228565b8360405161190160f01b8152600281019290925260228201526042902090565b5f836001600160a01b03163b5f03611953575f806119138585612351565b5090925090505f81600381111561192c5761192c612f13565b14801561194a5750856001600160a01b0316826001600160a01b0316145b925050506113a3565b61195e84848461239a565b90506113a3565b5f61197486610abe60016115db565b505f6119898661198389610c06565b85611ef3565b90505f6119998888888588612470565b905083515f036119ef57866001600160a01b03167fb8e138887d0aa13bab447e82de9d5c1777041ecd21ca36ba824ff1e6c07ddda4898884896040516119e294939291906138b0565b60405180910390a2611058565b866001600160a01b03167fe2babfbac5889a709b63bb7f598b324e08bc5a4fb9ec647fb3cbc9ec07eb87128988848989604051611a309594939291906138d7565b60405180910390a2979650505050505050565b5f65ffffffffffff821115611a75576040516306dfcc6560e41b81526030600482015260248101839052604401610ca8565b5090565b81545f9081816005811115611ad5575f611a928461256c565b611a9c90856135f5565b5f8881526020902090915081015465ffffffffffff9081169087161015611ac557809150611ad3565b611ad081600161377f565b92505b505b5f611ae2878785856126c4565b90508015611b1c57611b0687611af96001846135f5565b5f91825260209091200190565b54600160301b90046001600160d01b0316611058565b5f979650505050505050565b6008546040805165ffffffffffff928316815291831660208301527fc565b045403dc03c2eea82b81a0465edad9e2e7fc4d97e11421c209da93d7a93910160405180910390a16008805465ffffffffffff191665ffffffffffff92909216919091179055565b80515f906034811015611ba55760019150506109f1565b82810160131901516001600160a01b031981166b046e0e4dee0dee6cae47a60f60a31b14611bd8576001925050506109f1565b5f80611be56028856135f5565b90505b83811015611c55575f80611c1b888481518110611c0757611c07613556565b01602001516001600160f81b031916612723565b9150915081611c3357600196505050505050506109f1565b8060ff166004856001600160a01b0316901b1793505050806001019050611be8565b50856001600160a01b0316816001600160a01b031614935050505092915050565b5f611c8a868686868051906020012061148b565b905084518651141580611c9f57508351865114155b80611ca957508551155b15611cde57855184518651604051630447b05d60e41b8152600481019390935260248301919091526044820152606401610ca8565b5f81815260046020526040902054600160a01b900465ffffffffffff1615611d275780611d0a82610c38565b6040516331b75e4d60e01b8152610ca89291905f90600401613742565b5f611d30610c26565b611d3861130d565b65ffffffffffff16611d4a919061377f565b90505f611d6460085463ffffffff600160301b9091041690565b5f84815260046020526040902080546001600160a01b0319166001600160a01b038716178155909150611d9683611a43565b815465ffffffffffff91909116600160a01b0265ffffffffffff60a01b19909116178155611dc3826127b3565b815463ffffffff91909116600160d01b0263ffffffff60d01b1990911617815588517f7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e090859087908c908c906001600160401b03811115611e2657611e26612bfe565b604051908082528060200260200182016040528015611e5957816020015b6060815260200190600190039081611e445790505b508c89611e668a8261377f565b8e604051611e7c9998979695949392919061391c565b60405180910390a150505095945050505050565b60606109f77f00000000000000000000000000000000000000000000000000000000000000005f6127e3565b60606109f77f000000000000000000000000000000000000000000000000000000000000000060016127e3565b5f6109f743611a43565b5f7f0000000000000000000000000000000000000000000000000000000000000000604051630748d63560e31b81526001600160a01b038681166004830152602482018690529190911690633a46b1a890604401602060405180830381865afa158015611f62573d5f803e3d5ffd5b505050506040513d601f19601f820116820180604052508101906113a091906139f1565b80545f908015611fb557611f9f83611af96001846135f5565b54600160301b90046001600160d01b03166113a3565b5f9392505050565b606082611fd257611fcd8261288c565b6109f1565b50806109f1565b8063ffffffff165f036120015760405163f1cfbf0560e01b81525f6004820152602401610ca8565b6008546040805163ffffffff600160301b9093048316815291831660208301527f7e3f7f0708a84de9203036abaa450dccc85ad5ff52f78c170f3edb55cf5e8828910160405180910390a16008805463ffffffff909216600160301b0269ffffffff00000000000019909216919091179055565b60075460408051918252602082018390527fccb45da8d5717e6c4544694297c4ba5cf151d455c9bb0ed4fc7a38411bc05461910160405180910390a1600755565b5f60646120c283611063565b604051632394e7a360e21b8152600481018590526001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001690638e539e8c90602401602060405180830381865afa158015612125573d5f803e3d5ffd5b505050506040513d601f19601f8201168201806040525081019061214991906139f1565b6121539190613792565b6109f19190613a1c565b80545f906001600160801b0380821691600160801b9004168103612185576121856031612217565b6001600160801b038181165f908152600185810160205260408220805492905585546fffffffffffffffffffffffffffffffff19169301909116919091179092555090565b5f6001600160d01b03821115611a75576040516306dfcc6560e41b815260d0600482015260248101839052604401610ca8565b5f8061220a8585856128b5565b915091505b935093915050565b634e487b715f52806020526024601cfd5b5f306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614801561228057507f000000000000000000000000000000000000000000000000000000000000000046145b156122aa57507f000000000000000000000000000000000000000000000000000000000000000090565b6109f7604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201527f0000000000000000000000000000000000000000000000000000000000000000918101919091527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a08201525f9060c00160405160208183030381529060405280519060200120905090565b5f805f8351604103612388576020840151604085015160608601515f1a61237a88828585612a05565b955095509550505050612393565b505081515f91506002905b9250925092565b5f805f856001600160a01b031685856040516024016123ba929190613a3b565b60408051601f198184030181529181526020820180516001600160e01b0316630b135d3f60e11b179052516123ef9190613764565b5f60405180830381855afa9150503d805f8114612427576040519150601f19603f3d011682016040523d82523d5f602084013e61242c565b606091505b509150915081801561244057506020815110155b8015610dc357508051630b135d3f60e11b9061246590830160209081019084016139f1565b149695505050505050565b5f8581526009602090815260408083206001600160a01b03881684526003810190925282205460ff16156124c2576040516371c6af4960e01b81526001600160a01b0387166004820152602401610ca8565b6001600160a01b0386165f9081526003820160205260409020805460ff1916600117905560ff851661250b5783815f015f828254612500919061377f565b909155506125619050565b5f1960ff8616016125295783816001015f828254612500919061377f565b60011960ff8616016125485783816002015f828254612500919061377f565b6040516303599be160e11b815260040160405180910390fd5b509195945050505050565b5f60018211612579575090565b816001600160801b82106125925760809190911c9060401b5b6801000000000000000082106125ad5760409190911c9060201b5b64010000000082106125c45760209190911c9060101b5b6201000082106125d95760109190911c9060081b5b61010082106125ed5760089190911c9060041b5b601082106126005760049190911c9060021b5b6004821061260c5760011b5b600302600190811c9081858161262457612624613a08565b048201901c9050600181858161263c5761263c613a08565b048201901c9050600181858161265457612654613a08565b048201901c9050600181858161266c5761266c613a08565b048201901c9050600181858161268457612684613a08565b048201901c9050600181858161269c5761269c613a08565b048201901c90506126bb8185816126b5576126b5613a08565b04821190565b90039392505050565b5f5b8183101561271b575f6126d98484612acd565b5f8781526020902090915065ffffffffffff86169082015465ffffffffffff16111561270757809250612715565b61271281600161377f565b93505b506126c6565b509392505050565b5f8060f883901c602f8111801561273d5750603a8160ff16105b1561275257600194602f199091019350915050565b8060ff166040108015612768575060478160ff16105b1561277d576001946036199091019350915050565b8060ff166060108015612793575060678160ff16105b156127a8576001946056199091019350915050565b505f93849350915050565b5f63ffffffff821115611a75576040516306dfcc6560e41b81526020600482015260248101839052604401610ca8565b606060ff83146127fd576127f683612ae7565b90506109f1565b8180546128099061351e565b80601f01602080910402602001604051908101604052809291908181526020018280546128359061351e565b80156128805780601f1061285757610100808354040283529160200191612880565b820191905f5260205f20905b81548152906001019060200180831161286357829003601f168201915b505050505090506109f1565b80511561289c5780518082602001fd5b60405163d6bda27560e01b815260040160405180910390fd5b82545f90819080156129ab575f6128d187611af96001856135f5565b805490915065ffffffffffff80821691600160301b90046001600160d01b031690881682111561291457604051632520601d60e01b815260040160405180910390fd5b8765ffffffffffff168265ffffffffffff160361294d57825465ffffffffffff16600160301b6001600160d01b0389160217835561299d565b6040805180820190915265ffffffffffff808a1682526001600160d01b03808a1660208085019182528d54600181018f555f8f81529190912094519151909216600160301b029216919091179101555b945085935061220f92505050565b50506040805180820190915265ffffffffffff80851682526001600160d01b0380851660208085019182528854600181018a555f8a815291822095519251909316600160301b02919093161792019190915590508161220f565b5f80807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0841115612a3e57505f91506003905082612ac3565b604080515f808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa158015612a8f573d5f803e3d5ffd5b5050604051601f1901519150506001600160a01b038116612aba57505f925060019150829050612ac3565b92505f91508190505b9450945094915050565b5f612adb6002848418613a1c565b6113a39084841661377f565b60605f612af383612b24565b6040805160208082528183019092529192505f91906020820181803683375050509182525060208101929092525090565b5f60ff8216601f8111156109f157604051632cd44ac360e21b815260040160405180910390fd5b5f60208284031215612b5b575f80fd5b81356001600160e01b0319811681146113a3575f80fd5b5f60208284031215612b82575f80fd5b5035919050565b5f5b83811015612ba3578181015183820152602001612b8b565b50505f910152565b5f8151808452612bc2816020860160208601612b89565b601f01601f19169290920160200192915050565b602081525f6113a36020830184612bab565b80356001600160a01b0381168114610e88575f80fd5b634e487b7160e01b5f52604160045260245ffd5b604051601f8201601f191681016001600160401b0381118282101715612c3a57612c3a612bfe565b604052919050565b5f6001600160401b03821115612c5a57612c5a612bfe565b50601f01601f191660200190565b5f612c7a612c7584612c42565b612c12565b9050828152838383011115612c8d575f80fd5b828260208301375f602084830101529392505050565b5f82601f830112612cb2575f80fd5b6113a383833560208501612c68565b5f805f8060808587031215612cd4575f80fd5b612cdd85612be8565b9350612ceb60208601612be8565b92506040850135915060608501356001600160401b03811115612d0c575f80fd5b612d1887828801612ca3565b91505092959194509250565b5f6001600160401b03821115612d3c57612d3c612bfe565b5060051b60200190565b5f82601f830112612d55575f80fd5b81356020612d65612c7583612d24565b8083825260208201915060208460051b870101935086841115612d86575f80fd5b602086015b84811015612da957612d9c81612be8565b8352918301918301612d8b565b509695505050505050565b5f82601f830112612dc3575f80fd5b81356020612dd3612c7583612d24565b8083825260208201915060208460051b870101935086841115612df4575f80fd5b602086015b84811015612da95780358352918301918301612df9565b5f82601f830112612e1f575f80fd5b81356020612e2f612c7583612d24565b82815260059290921b84018101918181019086841115612e4d575f80fd5b8286015b84811015612da95780356001600160401b03811115612e6e575f80fd5b612e7c8986838b0101612ca3565b845250918301918301612e51565b5f805f8060808587031215612e9d575f80fd5b84356001600160401b0380821115612eb3575f80fd5b612ebf88838901612d46565b95506020870135915080821115612ed4575f80fd5b612ee088838901612db4565b94506040870135915080821115612ef5575f80fd5b50612f0287828801612e10565b949793965093946060013593505050565b634e487b7160e01b5f52602160045260245ffd5b60088110612f4357634e487b7160e01b5f52602160045260245ffd5b9052565b602081016109f18284612f27565b5f8060408385031215612f66575f80fd5b82359150612f7660208401612be8565b90509250929050565b803560ff81168114610e88575f80fd5b5f8060408385031215612fa0575f80fd5b82359150612f7660208401612f7f565b5f8083601f840112612fc0575f80fd5b5081356001600160401b03811115612fd6575f80fd5b602083019150836020828501011115612fed575f80fd5b9250929050565b5f805f805f805f60c0888a03121561300a575f80fd5b8735965061301a60208901612f7f565b955061302860408901612be8565b945060608801356001600160401b0380821115613043575f80fd5b61304f8b838c01612fb0565b909650945060808a0135915080821115613067575f80fd5b6130738b838c01612ca3565b935060a08a0135915080821115613088575f80fd5b506130958a828b01612ca3565b91505092959891949750929550565b5f805f805f608086880312156130b8575f80fd5b853594506130c860208701612f7f565b935060408601356001600160401b03808211156130e3575f80fd5b6130ef89838a01612fb0565b90955093506060880135915080821115613107575f80fd5b5061311488828901612ca3565b9150509295509295909350565b65ffffffffffff81168114610a0d575f80fd5b5f60208284031215613144575f80fd5b81356113a381613121565b5f805f8060608587031215613162575f80fd5b8435935061317260208601612f7f565b925060408501356001600160401b0381111561318c575f80fd5b61319887828801612fb0565b95989497509550505050565b5f805f80608085870312156131b7575f80fd5b84356001600160401b03808211156131cd575f80fd5b6131d988838901612d46565b955060208701359150808211156131ee575f80fd5b6131fa88838901612db4565b9450604087013591508082111561320f575f80fd5b61321b88838901612e10565b93506060870135915080821115613230575f80fd5b508501601f81018713613241575f80fd5b612d1887823560208401612c68565b5f60208284031215613260575f80fd5b6113a382612be8565b5f815180845260208085019450602084015f5b838110156132985781518752958201959082019060010161327c565b509495945050505050565b60ff60f81b8816815260e060208201525f6132c160e0830189612bab565b82810360408401526132d38189612bab565b606084018890526001600160a01b038716608085015260a0840186905283810360c085015290506133048185613269565b9a9950505050505050505050565b5f805f8060808587031215613325575f80fd5b8435935061333560208601612f7f565b925061334360408601612be8565b915060608501356001600160401b03811115612d0c575f80fd5b5f805f6060848603121561336f575f80fd5b61337884612be8565b92506020840135915060408401356001600160401b03811115613399575f80fd5b6133a586828701612ca3565b9150509250925092565b5f805f805f60a086880312156133c3575f80fd5b6133cc86612be8565b94506133da60208701612be8565b935060408601356001600160401b03808211156133f5575f80fd5b61340189838a01612db4565b94506060880135915080821115613416575f80fd5b61342289838a01612db4565b93506080880135915080821115613107575f80fd5b5f805f806060858703121561344a575f80fd5b61345385612be8565b93506020850135925060408501356001600160401b0381111561318c575f80fd5b5f60208284031215613484575f80fd5b813563ffffffff811681146113a3575f80fd5b5f80604083850312156134a8575f80fd5b6134b183612be8565b946020939093013593505050565b5f805f805f60a086880312156134d3575f80fd5b6134dc86612be8565b94506134ea60208701612be8565b9350604086013592506060860135915060808601356001600160401b03811115613512575f80fd5b61311488828901612ca3565b600181811c9082168061353257607f821691505b60208210810361355057634e487b7160e01b5f52602260045260245ffd5b50919050565b634e487b7160e01b5f52603260045260245ffd5b5f6020828403121561357a575f80fd5b81516001600160401b0381111561358f575f80fd5b8201601f8101841361359f575f80fd5b80516135ad612c7582612c42565b8181528560208385010111156135c1575f80fd5b6118c0826020830160208601612b89565b818382375f9101908152919050565b634e487b7160e01b5f52601160045260245ffd5b818103818111156109f1576109f16135e1565b65ffffffffffff828116828216039080821115613627576136276135e1565b5092915050565b5f6020828403121561363e575f80fd5b81516113a381613121565b65ffffffffffff818116838216019080821115613627576136276135e1565b5f815180845260208085019450602084015f5b838110156132985781516001600160a01b03168752958201959082019060010161367b565b5f8282518085526020808601955060208260051b840101602086015f5b848110156136eb57601f198684030189526136d9838351612bab565b988401989250908301906001016136bd565b5090979650505050505050565b608081525f61370a6080830187613668565b828103602084015261371c8187613269565b9050828103604084015261373081866136a0565b91505082606083015295945050505050565b838152606081016137566020830185612f27565b826040830152949350505050565b5f8251613775818460208701612b89565b9190910192915050565b808201808211156109f1576109f16135e1565b80820281158282048414176109f1576109f16135e1565b60ff81811683821601908111156109f1576109f16135e1565b600181815b808511156137fc57815f19048211156137e2576137e26135e1565b808516156137ef57918102915b93841c93908002906137c7565b509250929050565b5f82613812575060016109f1565b8161381e57505f6109f1565b8160018114613834576002811461383e5761385a565b60019150506109f1565b60ff84111561384f5761384f6135e1565b50506001821b6109f1565b5060208310610133831016604e8410600b841016171561387d575081810a6109f1565b61388783836137c2565b805f190482111561389a5761389a6135e1565b029392505050565b5f6113a360ff841683613804565b84815260ff84166020820152826040820152608060608201525f610dc36080830184612bab565b85815260ff8516602082015283604082015260a060608201525f6138fe60a0830185612bab565b82810360808401526139108185612bab565b98975050505050505050565b5f6101208b8352602060018060a01b038c16818501528160408501526139448285018c613668565b91508382036060850152613958828b613269565b915083820360808501528189518084528284019150828160051b850101838c015f5b838110156139a857601f19878403018552613996838351612bab565b9486019492509085019060010161397a565b505086810360a08801526139bc818c6136a0565b9450505050508560c08401528460e08401528281036101008401526139e18185612bab565b9c9b505050505050505050505050565b5f60208284031215613a01575f80fd5b5051919050565b634e487b7160e01b5f52601260045260245ffd5b5f82613a3657634e487b7160e01b5f52601260045260245ffd5b500490565b828152604060208201525f6113a06040830184612bab56fea2646970667358221220cbe6fed1b56b54c0e7fb568958b3dde5f059d6e9837742e25fb4377a560b8edb64736f6c63430008180033" as const;
