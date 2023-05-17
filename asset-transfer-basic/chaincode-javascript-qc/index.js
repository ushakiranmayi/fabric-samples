/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const quoteControl = require('./lib/quoteControl');

module.exports.QuoteControl = quoteControl;
module.exports.contracts = [quoteControl];
