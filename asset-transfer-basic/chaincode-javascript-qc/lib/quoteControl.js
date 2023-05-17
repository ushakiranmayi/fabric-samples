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
const { v4: uuidv4 } = require('uuid');


class QuoteControl extends Contract {

    //This function is used to take the inputs for Quote Request, validate given details and inititate quote process
    async CreateQuote(ctx, mode_of_transport, is_loose_cargo, loose_cargo_list, containers_list, cargo_ready_date, special_instructions, source_city, destination_city, 
        delivery_date, pickup_address, drop_off_address, inco_terms, export_declaration, customs_clearance, is_importer, ff_company_name, ff_email, ff_contact_person, ff_contact_number)
    {

        const quote = {
            mode_of_transport, //(air, ocean, ground) 
            is_loose_cargo,  // true , if false then go with containers 
            loose_cargo_list,  //array of loose_cargo objects
            containers_list , //array of containers object           
            cargo_ready_date,
            special_instructions,
            delivery_date, //required
            source_city,
            destination_city,
            pickup_address,
            drop_off_address,
            inco_terms,  //(optoinal, helpful, explanation here (also a competitor))
            export_declaration,  //required
            customs_clearance,  //required (if yes, then commercial invoice required)
            is_importer, // (y/n) - if n then consider as exporter
            ff_company_name, //Freight Forwarder company
            ff_email, //Freight email address
            ff_contact_person, //Freight forwarder contact person name
            ff_contact_number //Freight Forwarder company contact number
        }; 
        
        //Need to call Quote requirement validations
        const validated_quote = this.ValidateQuote(quote);

        if(validated_quote.is_importer){
            this.DFF_Initiate_Quote(validated_quote)
        }else{
            this.OFF_Initiate_Quote(validated_quote)
        }

        // To Do - Create Quote and generate a quote ID

        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        
        

        //await ctx.stub.putState(quote_id, Buffer.from(stringify(sortKeysRecursive(quote))));
        //return JSON.stringify(quote);
    }

    //This function is used to input transporters data to database
    async CreateTransporter(ctx, quoteId, mode, source, destination, per_unit_charge, forwarder_email)
    {
        const transporter_id = generateUniqueId();

        const transporters  = {
            quoteId,
            transporter_id,
            mode,
            source,
            destination,
            per_unit_charge,
            forwarder_email
        }   

        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(transporter_id, Buffer.from(stringify(sortKeysRecursive(transporters))));
        return JSON.stringify(transporters);
    }

    //This function is used to input customs data to database
    async CreateCustoms(ctx, transporter_id, material_type, per_unit_charge, country)
    {
        const customs_id = generateUniqueId();

        const customs_quote = {
            customs_id,
            transporter_id,
            material_type,
            per_unit_charge,
            country
        }

        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(customs_id, Buffer.from(stringify(sortKeysRecursive(customs_quote))));
        return JSON.stringify(customs_quote);
    }
    //1
    //Take all the inputs from request parms and validate, create quoteId 
    async ValidateQuote(ctx, quote_object) {
        //validations 
        const validModes = ['air', 'ocean', 'road'];

       
        //validate quote_object
        if (isNullOrEmpty(quote_object)) {
            throw new Error('quote_object should contain parameters.');
        }

        //validate mode_of_transport
        const { mode_of_transport } = quote_object;
        if (isNullOrEmpty(mode_of_transport)) {
            throw new Error('mode_of_transport parameter is required.');
        }
        const formattedMode = mode_of_transport.trim().toLowerCase();

        if (!validModes.includes(formattedMode)) {
          throw new Error('Invalid mode_of_transport parameter. Valid options are air, ocean, and road.');
        }
        
        //validate cargo type
        if(quote_object.is_loose_cargo){
            if(quote_object.loose_cargo_list.length < 1){
                throw new Error('loose_cargo info is required.');
            }            

        }else{
            if(quote_object.containers_list.length < 1){
                throw new Error('containers info is required.');
            }            

        }

        //validate delivery date
        if(isNullOrEmpty(quote_object.delivery_date)){
            throw new Error('delivery_date info is required.');
        }

        //validate cargo_ready_date
          if(isNullOrEmpty(quote_object.cargo_ready_date)){
            throw new Error('cargo_ready_date info is required.');
        }

        
        //validate pickup_address
        if(isNullOrEmpty(quote_object.pickup_address)){
            throw new Error('pickup_address info is required.');
        }
        //validate drop_off_address
        if(isNullOrEmpty(quote_object.drop_off_address)){
            throw new Error('drop_off_address info is required.');
        }

        //validate export declaration
        if(this.isNullOrEmpty(quote_object.export_declaration)){
            throw new Error('export_declaration info is required');
        }
        //validate is_customs_clearance
        if(this.isNullOrEmpty(quote_object.is_customs_clearance)){
            throw new Error('is_customs_clearance info is required');
        }
        //validate export declaration
        if(this.isNullOrEmpty(quote_object.is_importer)){
            throw new Error('importer/exporter info is required');
        }
        const quoteId = generateUniqueId();

        const validated_quote = {...quote_object}
        validated_quote.quote_id = quoteId;
        validated_quote.mode_of_transport = formattedMode; 

        return validated_quote;
        
        const quote = {
            quote_id : "",
            mode_of_transport : "", //(air, ocean, ground) 

            is_loose_cargo : "", // true , if false then go with containers 
            loose_cargo_list :"", //array of loose_cargo objects
            containers_list : "", //array of containers object
            
            //packing_list : "",  //no need to add this field
           
            cargo_ready_date : "",
            delivery_date: "", //required
            pickup_address : "",
            drop_off_address : "",
            inco_terms : "",  //(optoinal, helpful, explanation here (also a competitor))
            export_declaration: "",  //required
            is_customs_clearance: "",  //required (if yes, then commercial invoice required)
            commercial_invoice : "", // required only when customs_clearance is required 
            special_instructions : "",
            is_importer : "", // (y/n) - if n then consider as exporter,
        };

        const loose_cargo = {
            dims : "",
            dims_units : "",
            weight : "",
            weight_units : "",
            no_of_units : "",
            is_dg  : "",//(asks for SDS, if not available give option UN#, class# and HS# (required))
            dg_info : {"sds" : "", "UN#" : "" ,"class#" : "", "HS#": ""},
            is_tc: "",  //y/n (if yes, need specifics) stackable y/n)
            tc_info : "", //tc specifications
            stackable : "",//(y/n)
            
        }
        const containers = {
            no_of_units : "",
            container_type : "", //20,40,60
            is_dg  : "",//(asks for SDS, if not available give option UN#, class# and HS# (required))
            dg_info : {"sds" : "", "UN#" : "" ,"class#" : "", "HS#": ""},
            is_tc: "",  //y/n (if yes, need specifics) stackable y/n)
            tc_info : "", //tc specifications
            stackable : "",//(y/n)
        }

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


    /* Based on the source, destination and the frieght forwarder email given in Quote Request and mode decided in the OFF_initiate_quote function
     get the quote details from transporters list */
     async OFF_Quote_By_Mode(ctx, source, destination, ff_email, mode) {

        const query = "";

        if (ff_email.trim().length === 0){
            query = {
                selector: {
                    $and: [
                        {source: source },
                        {destination: destination },
                        {mode: mode }
                    ]
                }
            };
        }

        else {
            query = {
                selector: {
                    $and: [
                        {source: source },
                        {destination: destination },
                        {forwarder_email: ff_email},
                        {mode: mode }
                    ]
                }
            };
        }
    
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const results = [];
    
        while (true) {
            const res = await iterator.next();
    
            if (res.value && res.value.value.toString()) {
                const assetJSON = res.value.value.toString('utf8');
                results.push(JSON.parse(assetJSON));
            }
    
            if (res.done) {
                await iterator.close();
                break;
            }
        }
    
        return results;
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
    async OFF_Send_To_DFF(ctx, quote_object) {
        this.DFF_Customs_Quote(quote_object)
        this.DFF_Trucking_Quote(quote_object);
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
    async Final_Quote_OFF_To_Exporter(ctx, final_quote) {

        //trigger events upon generation of final_quote
        //send this to exporter - out-of-scope
    }

    //9 - decisions made in OFF initiation 

    //10
    async Final_Quote_DFF_To_Importer(ctx) {
    }

    
   
    //11 - covers 9 
    async OFF_Initiate_Quote(ctx,validated_quote) {
        //1. Make decision whether go with carrier based on mode_of_transport

        const is_carrier_required = true;

        const final_quote = {}
        if(validated_quote.mode_of_transport == "road"){
            is_carrier_required = false;
        }

        if(is_carrier_required){


            //get complete route options, given ff, quote_id , source and destination info 


            // based on route modes - call related off_get_quote functions
            const t1_info = this.OFF_Trucking_Quote();
            const air_info1 = this.OFF_Air_Quote();
            const t2_info  = this.OFF_Trucking_Quote();

            //generate final quote based on this 
            final_quote = {} //implement
            
        }else{
            //get single transported for the given source, destination, ff
            const t1_info = this.OFF_Trucking_Quote();
            final_quote = t1_info;

        }
        //2. searh the db based on source, destination, ff_email and get all the transporter_ids
        //3. if by road - get the trucking quote road  or 3 quotes  for carrier 
        
        this.Final_Quote_OFF_To_Exporter(final_quote);



        //1, 9, 2,3,4,5,6,7, 8


    }

    
    //12 - covers 13 and 16
    async DFF_Initiate_Quote(ctx) {
         //1. Make decision whether go with carrier based on mode_of_transport

         const is_carrier_required = true;

         const final_quote = {}
         if(validated_quote.mode_of_transport == "road"){
             is_carrier_required = false;
         }
 
         if(is_carrier_required){
             //get complete route options, given ff, quote_id , source and destination info 
 
             // based on route modes - call related off_get_quote functions
             const t1_info = this.DFF_Trucking_Quote();
             const air_info1 = this.DFF_Air_Quote();
             const t2_info  = this.DFF_Trucking_Quote();
 
             //generate final quote based on this 
             final_quote = {} //implement
             
         }else{
             //get single transported for the given source, destination, ff
             const t1_info = this.DFF_Trucking_Quote();
             final_quote = t1_info;
 
         }
         this.Final_Quote_DFF_To_Importer();
    }

    
    //13 - covered in dff process
    
    //14
    async Client_Accept_or_Decline_Quote(ctx) {

    }

    
    //15
    async Quote_Forward_to_Booking(ctx) {
    }

    //16 - decision making - dff initiation
    
    //17 -  events firing upon quote escalation 

    //18 - endpoints  to crud  entries to trasporters and customsQuote

    //19 - files upoad and validation -  email generation   -> future scope



    //Utils 

    // Helper function to generate a unique ID for the quote
    async generateUniqueId() {
        // Generate a unique ID using UUID v4
        const uniqueId = uuidv4();
        return uniqueId;
    }
    async isNullOrEmpty(value) {
        return value === null || value === undefined || value === '';
      }
}

module.exports = QuoteControl;
