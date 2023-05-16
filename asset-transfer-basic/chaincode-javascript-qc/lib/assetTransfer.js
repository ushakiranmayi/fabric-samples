/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class QuoteControl extends Contract {

    
    //should validate and inititate quote process
    async CreateQuote(ctx)
    {
       
    }
    //1
    //Take all the inputs from request parms and validate, create quoteId 
    async ValidateQuote(ctx) {
        //sample quote 
       
        const quote = {
            quote_id : "",
            mode_of_transport :  "", //(air, ocean, ground) 
            packing_list : "", 
            dims : "",
            dims_units : "",
            weight : "",
            no_of_pieces : "",
            weight_units : "",
            is_dg  : "",//(asks for SDS, if not available give option UN#, class# and HS# (required))
            temp_control: "",  //y/n (if yes, need specifics) stackable y/n)
            delivery_date: "", //required
            pickup_address : "",
            drop_off_address : "",
            inco_terms : "",  //(optoinal, helpful, explanation here (also a competitor))
            export_declaration: "",  //required
            customs_clearance: "",  //required (if yes, then commercial invoice required)
            temperature_control : "", // (y/n)
            is_importer : "", // (y/n) - if n then consider as exporter,
        };

        const transporters  = {
            transporter_id : "",
            quote_id : "",
            mode : "", //enum - road, ocean , air
            source : "",
            destination : "",
            per_unit_charge : " "//( weight/dims/distance
        }

        const customs_quote = {
            customs_id : "",
            quote_id : "",
            material_type : "",
            per_unit_charge : "",
            country : ""
        }
    }
    //2
    async OFF_Trucking_Quote(ctx) {
    }

    //3.1
    async OFF_Air_Quote(ctx) {
    }

    //3.2
    async OFF_Ocean_Quote(ctx) {
    }

    //4
    async OFF_Send_To_DFF(ctx) {
    }

    //5
    async DFF_Trucking_Quote(ctx) {
    }
    //6
    async DFF_Customs_Quote(ctx) {
    }

    //7
    async DFF_Send_To_OFF(ctx) {
    }

    //8
    async Final_Quote_OFF_To_Exporter(ctx) {
    }

    //9 - decisions made in OFF initiation 

    //10
    async Final_Quote_DFF_To_Importer(ctx) {
    }

   
    //11 - covers 9 
    async OFF_Initiate_Quote(ctx) {
    }

    
    //12 - covers 13 and 16
    async DFF_Initiate_Quote(ctx) {
    }

    
    //13 - covered in dff process
    
    //11
    async OFF_Initiate_Quote(ctx) {
    }

    
    //14
    async Client_Accept_or_Decline_Quote(ctx) {
    }

    
    //15
    async Quote_Forward_to_Booking(ctx) {
    }

    //16 - decision making - dff initiation
    
}

module.exports = QuoteControl;
