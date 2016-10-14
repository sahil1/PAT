'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
//EBS WS changes start
var https = require('https');
var http = require('http');
var username = 'operations';
var password = 'welcome';
var reqPost;
var tokenName;
var tokenValue;
var xml2js = require('xml2js');
//EBS WS changes End

const restService = express();
restService.use(bodyParser.json());

restService.post('/hook', function(req, res) {

    console.log('hook request');

    try {
        var speech = 'empty speech';

        if (req.body) {
            console.log('Request Body: ', req.body);
            var requestBody = req.body;
            console.log('requestBody.result: ', requestBody.result);
            if (requestBody.result) {
                speech = '';
                console.log('fulfillment: ', requestBody.result.fulfillment);
                if (requestBody.result.fulfillment) {
                    console.log('Initial speech: ', requestBody.result.fulfillment.speech);
                    speech += requestBody.result.fulfillment.speech + ' ';
                    console.log('Initial speech:1: ', requestBody.result.fulfillment.speech);
                }
                console.log('requestBody.result: ', requestBody.result);
                if (requestBody.result.action) {
                    //calling EBS WS
                    if (requestBody.result.action === 'team8-repeatorder') {
                        const order = requestBody.result.parameters.order_number;
                        //console.log('qty: ', qty);
                        //console.log('item: ', item);
                        if (!order) {

                            return res.json({
                                status: 'ok',
                                incomplete: true
                            });
                        } else {
                            processRepeatOrder(order, function(returnedJson) {
                                return getJson(requestBody, res, speech, returnedJson, requestBody.result.action);
                            });
                        }


                    } else if (requestBody.result.action === 'team8-createorder') {
                        const item = requestBody.result.parameters.item_name;
                        const qty = requestBody.result.parameters.quantity;
                        //console.log('qty: ', qty);
                        //console.log('item: ', item);
                        if (!item || !qty) {

                            return res.json({
                                status: 'ok',
                                incomplete: true
                            });
                        } else {


                            processCreateOrder(item, qty, function(returnedJson) {

                                return getJson(requestBody, res, speech, returnedJson, requestBody.result.action);
                            });
                        }
                    } else if (requestBody.result.action === 'team8-voidorder') {
                        const orderNumber = requestBody.result.parameters.order_number;
                        if (!orderNumber) {

                            return res.json({
                                status: 'ok',
                                incomplete: true
                            });
                        } else {


                            //START CKASERA
                            processCancelOrders(orderNumber, function(returnedJson) {
                                console.log('result for processCancelOrders: ', returnedJson);
                                return getJson(requestBody, res, speech, returnedJson, requestBody.result.action);
                            });
                        }
                        //END CKASERA

                    } else if (requestBody.result.action === 'team8-queryorder') {
                        const orderNumber = requestBody.result.parameters.order_number;
                        if (!orderNumber) {

                            return res.json({
                                status: 'ok',
                                incomplete: true
                            });
                        } else {


                            //START CKASERA
                            processQueryOrder(orderNumber, function(returnedJson) {
                                console.log('result for processQueryOrder: ', returnedJson);
                                return getJson(requestBody, res, speech, returnedJson, requestBody.result.action);
                            });
                        }
                        //END CKASERA                    	


                    } else if (requestBody.result.action === 'team8-queryfeworder') {
                        const count = requestBody.result.parameters.count;
                        const cName = requestBody.result.parameters.customer_name;
                        //console.log('qty: ', qty);
                        //console.log('item: ', item);
                        if (!count) {

                            return res.json({
                                status: 'ok',
                                incomplete: true
                            });
                        } else {

                            processFewOrders(count, cName, function(returnedJson) {
                                console.log('result: ', returnedJson);
                                return getJson(requestBody, res, speech, returnedJson, requestBody.result.action);
                            });

                        }


                    } else if (requestBody.result.action === 'team8-expediteorder') {

                    }

                    //speech += 'EBS action: ' + requestBody.result.action;
                }
            }
        }



    } catch (err) {
        console.error("Can't process request", err);

        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});

function getJson(requestBody, res, speech, returnedJson, action) {
    console.log('action :' + action);
    /*restService.use('/sendEmail.json', (req, res) => {
        if ((action == 'team8-createorder') ||
            (action == 'team8-expediteorder')) {
            const email = 'abhinav.dagur@oracle.com'; //requestBody.result.parameters.email;
            var subject;
            if (action === 'team8-createorder') {
                subject = 'Order Placed';
            } else {
                subject = 'Order Expedited';
            }
            const message = 'abhinav.dagur@oracle.com'; //requestBody.result.parameters.messageOriginal;
            //if (email && message) {
                console.log('Sending email');
                const options = {
                    method: 'POST',
                    url: 'http://cass-dev.theiotlabs.com/parse/functions/sendEmail',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10 * 60 * 1000,
                    json: {
                        email,
                        subject,
                        message
                    }
                };
                console.log('set options and call request ');
                request(options, (error, response, body) => {
                    res.setHeader('Content-Type', 'application/json');
                    const result = {
                      status: 'ok',
                      incomplete: false,
                      speech: 'email sent!'
                    };
                    console.log('returned result');
                    res.json(result);
                    console.log('error: ' + error);
                    console.log('error: ' + response);
                    console.log('error: ' + body);
                    console.log('set options and call request ');
                });
            //}
        }
    });*/
    if (action === 'team8-createorder') {
        console.log('returnedJson: ', returnedJson);
        console.log('\n');
        //console.log('Status: ', returnedJson.response[]);
        console.log('speech: ', speech);
        console.log('\n');
        console.log('Order#: ', returnedJson.response.salesorder[0].ordernumber);
        console.log('\n');
        console.log('Header#: ', returnedJson.response.salesorder[0].headerid);
        //console.log('\n');
        var llink = ' http://rws3220164.us.oracle.com:8003/OA_HTML/OA.jsp?OAFunc=ONT_PORTAL_ORDERDETAILS&HeaderId=' + returnedJson.response.salesorder[0].headerid;
        var str = returnedJson.response.salesorder[0].ordernumber.toString();
        var result = str.link(llink);
        speech += 'New order# ' + result;

    } else if (requestBody.result.action === 'team8-expediteorder') {

    } else if (requestBody.result.action === 'team8-queryfeworder') {
    	//const orderNumber = returnedJson.response.salesorders[0].salesorder[0].ordernumber;
    	console.log('returnedJson: ', returnedJson);
    	console.log('response: ', returnedJson.response);
    	console.log('salesorders: ', returnedJson.response.salesorders[0]);
    	speech = 'Orders queried :'+' \n ';
    	for (var i = 0; i < returnedJson.response.salesorders[0].salesorder.length; i++) {
    		
    		speech += 'Order Number: '+returnedJson.response.salesorders[0].salesorder[i].ordernumber+
    		' Quantity: '+returnedJson.response.salesorders[0].salesorder[i].orderedquantity+
    		' Schedule Ship Date: '+returnedJson.response.salesorders[0].salesorder[i].scheduledshipstate+
    		' Schedule Arrival Date: '+returnedJson.response.salesorders[0].salesorder[i].scheduledarrivaldate+
    		' Total Amount: '+returnedJson.response.salesorders[0].salesorder[i].ordertotal+
    		' Status: '+returnedJson.response.salesorders[0].salesorder[i].orderstatus+' \n ';
    		//console.log('ordernumber: ', returnedJson.response.salesorders[0].salesorder[i].ordernumber);
    		//speech += returnedJson.response.salesorders[0].salesorder[i].ordernumber+' \n ';
			}
			//speech = speech.substring(0, speech.length - 2)+'.';

    } else if (requestBody.result.action === 'team8-expediteorder') {} else if (requestBody.result.action === 'team8-voidorder') {
        const status = returnedJson.response.salesorder[0].status;
        if (!('S' == status)) {
            speech = 'Order cannot be cancelled. Please contact customer support. ';
        }
    } else if (requestBody.result.action === 'team8-queryorder') {
        //console.log('Order#: ', returnedJson.response.salesorders);
        //console.log('Order#: ', returnedJson.response.salesorders[0].salesorder);
        //console.log('Order#: ', returnedJson.response.salesorders[0].salesorder[0].ordernumber);
        const orderNumber = returnedJson.response.salesorders[0].salesorder[0].ordernumber;
        const orderstatus = returnedJson.response.salesorders[0].salesorder[0].orderstatus;
        const ordereditem = returnedJson.response.salesorders[0].salesorder[0].ordereditem;
        const orderedquantity = returnedJson.response.salesorders[0].salesorder[0].orderedquantity
        const ordertotal = returnedJson.response.salesorders[0].salesorder[0].ordertotal;
        const scheduledshipstate = returnedJson.response.salesorders[0].salesorder[0].scheduledshipstate;
        speech = 'Order ' + orderNumber + ' contains ' + orderedquantity + ' unit(s) of ' + ordereditem + ' worth ' + ordertotal + ' is in status ' + orderstatus + ' and ready to be shipped on ' + scheduledshipstate;
        //Order 69384 contains 15 units of AMO-100 worth $1123.87 is ready to be shipped via FedEx on Oct 17, 2016.
    }




    return res.json({
        speech: speech,
        displayText: speech,
        status: 'ok',
        incomplete: false,
        source: 'EBS-WebService-Response'
    });
}

restService.listen((process.env.PORT || 5000), function() {
    console.log("Server listening");
});

function processFewOrders(count, customerName, callback) {
    getAccessToken(function(tokenName, tokenValue) {

        callQueryLastOrders(tokenName, tokenValue, count, function(inputXml) {

            //console.log("inputXml :" + inputXml);
            var parser = new xml2js.Parser();

            parser.parseString(inputXml, function(err, result) {
console.log("result :" + result);
                //return callback(JSON.stringify(result));
                return callback(result);


            });


        });

    })
}


function processRepeatOrder(orderNumber, callback) {
    getAccessToken(function(tokenName, tokenValue) {

        callRepeatOrders(orderNumber, tokenName, tokenValue, function(inputXml) {

            console.log("inputXml :" + inputXml);
            var parser = new xml2js.Parser();

            parser.parseString(inputXml, function(err, result) {

                //return callback(JSON.stringify(result));
                return callback(result);


            });


        });

    });
}

function processCreateOrder(itemName, qty, callback) {
    console.log(" In processCreateOrder :");
    getAccessToken(function(tokenName, tokenValue) {

        callCreateOrder(itemName, qty, tokenName, tokenValue, function(inputXml) {

            console.log("inputXml :" + inputXml);
            var parser = new xml2js.Parser();

            parser.parseString(inputXml, function(err, result) {

                //return callback(JSON.stringify(result));
                return callback(result);


            });


        });

    });

}

function getAccessToken(callBackAccessToken) {

    var optionsgetAccessToken = {
        host: 'rws3220164.us.oracle.com', // here only the domain name (no http/https !)
        port: 8003,
        auth: username + ':' + password,
        connection: 'keep-alive',
        path: '/OA_HTML/RF.jsp?function_id=mLogin', // the rest of the url with parameters if needed
        method: 'GET' // do GET
    };

    var reqGet = http.request(optionsgetAccessToken, function(res) {

        console.info('inside getting the token Info');

        console.log("statusCode: ", res.statusCode);
        console.log("headers: ", res.headers);


        res.on('data', function(d) {
            console.info('GET result:\n');
            console.info(d.toString());

            var parser = new xml2js.Parser();

            parser.parseString(d, function(err, result) {
                tokenName = result.response.data[0].accessTokenName.toString();
                tokenValue = result.response.data[0].accessToken.toString();
                console.dir(tokenName);
                console.dir(tokenValue);
                console.info('Got Token Name and value');
            });

            console.info('\n\nCall completed');

        });
        res.on('end', () => {
            console.log('No more data in response.');
            if (res.statusCode == '200') {
                return callBackAccessToken(tokenName, tokenValue);
            }

        });


    });
    console.info(reqGet);
    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e);
    });
}

function getOptionsPost(body, EBSFunctionName) {

    var postheaders = {
        'content-type': 'text/xml',
        'Cookie': tokenName + '=' + tokenValue,
        'Cache-Control': 'no-cache',
        'Content-Length': Buffer.byteLength(body, 'utf8')
    }

    var optionspost = {
        host: 'rws3220164.us.oracle.com',
        port: 8003,
        path: '/OA_HTML/RF.jsp?function_id=' + EBSFunctionName + '&resp_id=21623&resp_appl_id=660&security_group_id=0',
        method: 'POST',
        headers: postheaders
    };

    return optionspost;


}


function callCreateOrder(itemName, qty, tokenName, tokenValue, callBackLastOrders) {
    //itemName
    var body = '<params><param>1006</param><param>2626</param><param>1025</param><param>1026</param><param>' + qty + '</param></params>';
    var returnxml;

    var reqPost = http.request(getOptionsPost(body, 'ONT_REST_CREATE_ORDER'), function(res) {

        //console.log("POST headers: ", res.headers);
        console.log(" POST statusCode: ", res.statusCode);

        res.on('data', function(d) {
            console.info('POST result:\n');
            //process.stdout.write(d);
            returnxml = d;
            //console.info('\n\nPOST completed');
        });

        res.on('end', () => {
            if (res.statusCode == '200') {
                return callBackLastOrders(returnxml);
            }

        });
    });
    console.info('after POST body' + body);
    // write the xml data
    reqPost.write(body);
    reqPost.end();
    reqPost.on('error', function(e) {
        console.error(e);
    });
}

function callRepeatOrders(orderNumber, tokenName, tokenValue, callBackLastOrders) {
    var body = '<params>' + orderNumber + '</params>';
    var returnxml;

    var reqPost = http.request(getOptionsPost(body, 'ONT_REST_SALES_ORDERS'), function(res) {

        //console.log("POST headers: ", res.headers);
        console.log(" POST statusCode: ", res.statusCode);

        res.on('data', function(d) {
            console.info('POST result:\n');
            //process.stdout.write(d);
            returnxml = d;
            //console.info('\n\nPOST completed');
        });

        res.on('end', () => {
            if (res.statusCode == '200') {
                return callBackLastOrders(returnxml);
            }

        });
    });
    console.info('after POST body' + body);
    // write the xml data
    reqPost.write(body);
    reqPost.end();
    reqPost.on('error', function(e) {
        console.error(e);
    });
}

function callQueryLastOrders(tokenName, tokenValue, days, callBackLastOrders) {
    //var body = '<params>'+days+'</params>';
    var body = '<params><param>' + days + '</param></params>';
    var returnxml;

    var reqPost = http.request(getOptionsPost(body, 'ONT_REST_SALES_ORDERS'), function(res) {

        //console.log("POST headers: ", res.headers);
        console.log(" POST statusCode: ", res.statusCode);
				var counter = 0;
        res.on('data', function(d) {
        		counter++;
            //console.info('POST result:\n');
            process.stdout.write(d);
            
            if (counter == 1) {
            	returnxml = d;
          	}	else{
          		returnxml += d;
          		console.log(" $$$$$returnxml : ", returnxml);
            }
            console.log(" calling : ", counter);
            
            
            //return callBackLastOrders(d);
            //returnxml = '<response status="200"><salesorders><salesorder><ordernumber>69403</ordernumber><headerid>361378</headerid><creationdate>13-OCT-2016</creationdate><fulfillmentdate>null</fulfillmentdate><scheduledshipstate>13-OCT-2016</scheduledshipstate><scheduledarrivaldate>13-OCT-2016</scheduledarrivaldate><ordereditem>ASO0024</ordereditem><orderedquantity>1</orderedquantity><ordertotal>415 USD</ordertotal><orderstatus>Entered</orderstatus></salesorder><salesorder><ordernumber>69402</ordernumber><headerid>361377</headerid><creationdate>13-OCT-2016</creationdate><fulfillmentdate>null</fulfillmentdate><scheduledshipstate>13-OCT-2016</scheduledshipstate><scheduledarrivaldate>13-OCT-2016</scheduledarrivaldate><ordereditem>ASO0024</ordereditem><orderedquantity>1</orderedquantity><ordertotal>415 USD</ordertotal><orderstatus>Entered</orderstatus></salesorder><salesorder><ordernumber>69401</ordernumber><headerid>361376</headerid><creationdate>13-OCT-2016</creationdate><fulfillmentdate>null</fulfillmentdate><scheduledshipstate>13-OCT-2016</scheduledshipstate><scheduledarrivaldate>13-OCT-2016</scheduledarrivaldate><ordereditem>ASO0024</ordereditem><orderedquantity>4</orderedquantity><ordertotal>1660 USD</ordertotal><orderstatus>Entered</orderstatus></salesorder></salesorders></response>';
            //console.log(" returnxml: ", returnxml);
            //console.info('\n\nPOST completed');
        });

        res.on('end', () => {
            if (res.statusCode == '200') {
                return callBackLastOrders(returnxml);
            }

        });
    });
    console.info('after POST body' + body);
    // write the xml data
    reqPost.write(body);
    reqPost.end();
    reqPost.on('error', function(e) {
        console.error(e);
    });
}

function processCancelOrders(orderNumber, callback) {
    getAccessToken(function(tokenName, tokenValue) {

        callCancelOrders(tokenName, tokenValue, orderNumber, function(inputXml) {

            console.log("inputXml :" + inputXml);
            var parser = new xml2js.Parser();

            parser.parseString(inputXml, function(err, result) {

                //return callback(JSON.stringify(result));
                return callback(result);


            });


        });

    })
}

function callCancelOrders(tokenName, tokenValue, orderNumber, processCancelOrders) {
    console.log('in func callCancelOrders');
    var body = '<params><param>' + orderNumber + '</param></params>';
    var returnxml;
    console.log('calling getOptionsPost');
    var reqPost = http.request(getOptionsPost(body, 'ONT_REST_CANCEL_ORDER'), function(res) {

        //console.log("POST headers: ", res.headers);
        console.log(" POST statusCode in callCancelOrders: ", res.statusCode);

        res.on('data', function(d) {
            console.info('POST result:\n');
            //process.stdout.write(d);
            returnxml = d;
            //console.info('\n\nPOST completed');
        });

        res.on('end', () => {
            if (res.statusCode == '200') {
                return processCancelOrders(returnxml);
            }

        });
    });
    console.info('after POST body' + body);
    // write the xml data
    reqPost.write(body);
    reqPost.end();
    reqPost.on('error', function(e) {
        console.error(e);
    });
}
//END CKASERA
function processQueryOrder(orderNumber, callback) {
    getAccessToken(function(tokenName, tokenValue) {

        callQueryOrder(tokenName, tokenValue, orderNumber, function(inputXml) {

            console.log("inputXml :" + inputXml);
            var parser = new xml2js.Parser();

            parser.parseString(inputXml, function(err, result) {

                //return callback(JSON.stringify(result));
                return callback(result);


            });


        });

    })
}

function callQueryOrder(tokenName, tokenValue, orderNumber, processQueryOrder) {
    console.log('in func callQueryOrder');
    var body = '<params><param>' + orderNumber + '</param></params>';
    var returnxml;
    console.log('calling getOptionsPost');
    var reqPost = http.request(getOptionsPost(body, 'ONT_REST_GET_ORDER'), function(res) {

        //console.log("POST headers: ", res.headers);
        console.log(" POST statusCode in callQueryOrder: ", res.statusCode);

        res.on('data', function(d) {
            console.info('POST result:\n');
            //process.stdout.write(d);
            returnxml = d;
            //console.info('\n\nPOST completed');
        });

        res.on('end', () => {
            if (res.statusCode == '200') {
                return processQueryOrder(returnxml);
            }

        });
    });
    console.info('after POST body' + body);
    // write the xml data
    reqPost.write(body);
    reqPost.end();
    reqPost.on('error', function(e) {
        console.error(e);
    });
}