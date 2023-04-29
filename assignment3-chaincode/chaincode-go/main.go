/*
SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	"log"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"




"chaincode"
)

func main() {
	fenChaincode, err := contractapi.NewChaincode(&chaincode.SmartContract{})
	if err != nil {
		log.Panicf("Error creating Franchise_Employee_Network chaincode: %v", err)
	}

	if err := fenChaincode.Start(); err != nil {
		log.Panicf("Error starting Franchise_Employee_Network chaincode: %v", err)
	}
}
