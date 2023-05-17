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

    
    //This function is used to take the inputs for Quote Request, validate given details and inititate quote process
    async CreateQuote(ctx, mode_of_transport, packing_list, dims, dims_units, weight, no_of_pieces, weight_units, is_dg, temp_control, source_city, destination_city, 
        delivery_date, pickup_address, drop_off_address, inco_terms, export_declaration, customs_clearance, temperature_control, is_importer, ff_company_name, 
        ff_email, ff_contact_person, ff_contact_number)
    {

        const quote = {
            mode_of_transport, //(air, ocean, ground) 
            packing_list, 
            dims,
            dims_units,
            weight,
            no_of_pieces,
            weight_units,
            is_dg,//(asks for SDS, if not available give option UN#, class# and HS# (required))
            temp_control,  //y/n (if yes, need specifics) stackable y/n)
            delivery_date, //required
            source_city,
            destination_city,
            pickup_address,
            drop_off_address,
            inco_terms,  //(optoinal, helpful, explanation here (also a competitor))
            export_declaration,  //required
            customs_clearance,  //required (if yes, then commercial invoice required)
            temperature_control, // (y/n)
            is_importer, // (y/n) - if n then consider as exporter
            ff_company_name, //Freight Forwarder company
            ff_email, //Freight email address
            ff_contact_person, //Freight forwarder contact person name
            ff_contact_number //Freight Forwarder company contact number            
        }; 
        
        // Perform Quote validations


        // To Do - Create Quote and generate a quote ID

        
    }

    //This function is used to input transporters data to database
    async CreateTransporter(ctx, quote_id, mode, source, destination, per_unit_charge, forwarder_email)
    {
        const transporters  = {
            quote_id,
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
    async CreateCustoms(ctx, quote_id, material_type, per_unit_charge, country)
    {
        const customs_quote = {
            quote_id,
            material_type,
            per_unit_charge,
            country
        }

        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(customs_id, Buffer.from(stringify(sortKeysRecursive(customs_quote))));
        return JSON.stringify(customs_quote);
    }

              
    
    //Take all the inputs from request parms and validate, create quoteId 
    async ValidateQuote(ctx) {
               
        
    }
    
    // // 2 _ Modify the User Story
    // /* Based on the source, destination and the frieght forwarder email given in Quote Request and mode decided in the OFF_initiate_quote function
    //  get the quote details from transporters list */
    // async OFF_Quote_By_Mode(ctx, source, destination, ff_email, mode) {

    //     const query = "";

    //     if (ff_email.trim().length === 0){
    //         query = {
    //             selector: {
    //                 $and: [
    //                     { source: source },
    //                     { destination: destination },
    //                     { mode: mode }
    //                 ]
    //             }
    //         };
    //     }

    //     else {
    //         query = {
    //             selector: {
    //                 $and: [
    //                     { source: source },
    //                     { destination: destination },
    //                     { forwarder_email: ff_email},
    //                     { mode: mode }
    //                 ]
    //             }
    //         };
    //     }
    
    //     const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
    //     const results = [];
    
    //     while (true) {
    //         const res = await iterator.next();
    
    //         if (res.value && res.value.value.toString()) {
    //             const assetJSON = res.value.value.toString('utf8');
    //             results.push(JSON.parse(assetJSON));
    //         }
    
    //         if (res.done) {
    //             await iterator.close();
    //             break;
    //         }
    //     }
    
    //     return results;
    // }
    
    async OFF_Quote_By_Mode(ctx, source, destination, ff_email, mode) {
        const query = {
          selector: {
            $and: [
              { source },
              { destination },
              { mode },
            ],
          },
        };
      
        if (ff_email) {
          query.selector.$and.push({ forwarder_email: ff_email });
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

    // //3 - Modify the User Story: Get the path in which this freight will be transported
    // async Define_Transport_Path(ctx, source, destination, ff_email, mode) {

    //     const quoteQuery = {
    //         selector: {
    //             $and: [
    //                 { source_city: source },
    //                 { destination_city: destination },
    //                 { ff_email: ff_email },
    //                 { mode_of_transport: mode }
    //             ]
    //         }
    //     };
    
    //     const quoteIterator = await ctx.stub.getQueryResult(JSON.stringify(quoteQuery));
    //     const quoteIds = [];
    
    //     while (true) {
    //         const res = await quoteIterator.next();
    
    //         if (res.value && res.value.value.toString()) {
    //             const assetJSON = res.value.value.toString('utf8');
    //             const quote = JSON.parse(assetJSON);
    //             quoteIds.push(quote.quote_id);
    //         }
    
    //         if (res.done) {
    //             await quoteIterator.close();
    //             break;
    //         }
    //     }
    
    //     // Search for quote IDs in the transporters table
    //     const transportersQuery = {
    //         selector: {
    //             quote_id: { $in: quoteIds }
    //         }
    //     };
    
    //     const transportersIterator = await ctx.stub.getQueryResult(JSON.stringify(transportersQuery));
    //     const transporters = [];
    
    //     while (true) {
    //         const res = await transportersIterator.next();
    
    //         if (res.value && res.value.value.toString()) {
    //             const assetJSON = res.value.value.toString('utf8');
    //             const transporter = JSON.parse(assetJSON);
    //             transporters.push(transporter);
    //         }
    
    //         if (res.done) {
    //             await transportersIterator.close();
    //             break;
    //         }
    //     }
    
    //     return transporters;
        
    // }

    // 3 - Alternate solution define transport path

    async Define_Transport_Path(ctx, source, destination, ff_email, mode) {

        const quotes = this.ctx.stub.getStateByRange("quote", {
            source_city: source_city,
            destination_city: destination_city,
            mode_of_transport: mode_of_transport,
          });
          
          // Get the transporter details for the quote ids
          const transporterIds = [];
          for (const quote of quotes) {
            transporterIds.push(quote.quote_id);
          }
          
          // Get the transporter details based on transporter ids
          const transporters = this.ctx.stub.getStateByRange("transporter", {
            quote_id: transporterIds,
          });
          
          // Print the transporter details
          return transporters;
          
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
