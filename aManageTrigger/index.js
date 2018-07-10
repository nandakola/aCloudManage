var ComputeManagementClient = require('azure-arm-compute');
var msRestAzure = require('ms-rest-azure');
var util = require('util');
var sendgrid = require('sendgrid');
const yaml = require('js-yaml');
const fs = require('fs');
var computeClient;

module.exports = function (context, myTimer) {
    // var timeStamp = new Date().toISOString();
    
    // if(myTimer.isPastDue)
    // {
    //     context.log('JavaScript is running late!');
    // }
    // context.log('JavaScript timer trigger function ran!', timeStamp);   
    
    // context.done();
    
    var bodyVal;
    context.log('JavaScript HTTP trigger function processed a request.');
    var file;
    var path = __dirname + '//amcloud.yml';
    fs.readFile(path, 'utf8', function (e, data) {
        if (e) {
            context.log('config.yml not found.');
        } else {
            file = yaml.safeLoad(data, 'utf8');
            msRestAzure.loginWithServicePrincipalSecret(file.clientId, file.secret, file.domain, function (err, credentials, subscriptions) {
                if (err) return context.log(err);
                computeClient = new ComputeManagementClient(credentials, file.subscriptionId);
                var d = new Date();
                var today = new Date();                
                console.log("today is ****"+today.getDay());            
                
                for (var i = 0; i < file.serverSchedule.length; i++) {
                    context.log('hello ' + file.serverSchedule[i].includeWeekends);
                    if (!file.serverSchedule[i].includeWeekends) {
                        if(today.getDay()===0 || today.getDay() === 6){
                            continue; 
                        }                        
                    }
                    context.log(file.serverSchedule[i].instanceName);
                    //Check Startserver schedule                        
                    var s = file.serverSchedule[i].startTime.split(":");
                    d.setHours(s[0], s[1], 0, 0);
                    var diff = today - d;
                    var timeDiffInMin = Math.floor((diff / 1000) / 60)
                    context.log("today is " + today);
                    context.log("config time is  is " +  d);
                    context.log("Startup Time in mins" + timeDiffInMin);
                    if (timeDiffInMin >= -5 && timeDiffInMin < 0) {
                        // console.log(timeDiffInMin + "Time diff match");
                        context.log(file.serverSchedule[i].instanceName);
                        //get status of the server
                        computeClient.virtualMachines.get(file.serverSchedule[i].resourceGroupName, file.serverSchedule[i].instanceName, { expand: "instanceView" }, function (err, result, request, response) {
                            //console.log(element.name + " - " + result.instanceView.statuses[1].displayStatus);
                            if (err) {
                                context.log(err);
                            } else {
                                if (result.instanceView.statuses.length === 2) {
                                    result.powerState = result.instanceView.statuses[1].displayStatus;
                                } else if (result.instanceView.statuses.length === 1) {
                                    result.powerState = result.instanceView.statuses[0].displayStatus;
                                } else {
                                    //console.log(result.instanceView.statuses);
                                    result.powerState = "unknown";
                                }
                                result.resourceGroupName = result.id.split('/')[4];
                                context.log("**********fINAL pOWER STATE OF THE vm ****** " + result.powerState);
                                console.log(result);          
                                //   if (result.powerState === 'VM running') {
                                //       stop_vm(result.resourceGroupName, result.name);
                                //   } else 
                                if (result.powerState === 'VM deallocated') {
                                    start_vm(result.resourceGroupName, result.name);                                   
                                    sendMail(file.sendgridKey, file.startUpEmail.toEmail, file.startUpEmail.fromEmail, file.startUpEmail.subject, file.startUpEmail.scheduledBodyText, file.startUpEmail.htmlText,result.name);
                                }
                            }
                        });
                    } else {
                        context.log(timeDiffInMin);
                    }
                    if (timeDiffInMin >-32 && timeDiffInMin < -28) {
                        sendMail(file.sendgridKey, file.startUpEmail.toEmail, file.startUpEmail.fromEmail, file.startUpEmail.scheduledSubject, file.startUpEmail.bodyText, file.startUpEmail.scheduledText,file.serverSchedule[i].instanceName);
                    }
                    //Check Shutdown schedule
                    s = file.serverSchedule[i].shutDownTime.split(":");
                    var shutdow
                    d.setHours(s[0], s[1], 0, 0);
                    diff = today - d;
                    timeDiffInMin = Math.floor((diff / 1000) / 60)
                    // console.log("Shutdown Time in mins" + timeDiffInMin);
                    if (timeDiffInMin >= -5 && timeDiffInMin < 0) {
                        // console.log(timeDiffInMin + "Time diff match");
                        //get status of the server
                        computeClient.virtualMachines.get(file.serverSchedule[i].resourceGroupName, file.serverSchedule[i].instanceName, { expand: "instanceView" }, function (err, result, request, response) {
                            //console.log(element.name + " - " + result.instanceView.statuses[1].displayStatus);
                            if (err) {
                                context.log(err);
                            } else {
                                if (result.instanceView.statuses.length === 2) {
                                    result.powerState = result.instanceView.statuses[1].displayStatus;
                                } else if (result.instanceView.statuses.length === 1) {
                                    result.powerState = result.instanceView.statuses[0].displayStatus;
                                } else {
                                    // console.log(result.instanceView.statuses);
                                    result.powerState = "unknown";
                                }
                                result.resourceGroupName = result.id.split('/')[4];
                                context.log("**********fINAL pOWER STATE OF THE vm ****** "+  result.powerState);
                                // console.log(result);          
                                if (result.powerState === 'VM running') {
                                    stop_vm(result.resourceGroupName, result.name); 
                                    sendMail(file.sendgridKey, file.shutdownEmail.toEmail, file.shutdownEmail.fromEmail, file.shutdownEmail.subject, file.shutdownEmail.bodyText, file.shutdownEmail.htmlText,result.name);
                                }
                                //   else if (result.powerState === 'VM deallocated') {
                                //       start_vm(result.resourceGroupName, result.name);
                                //   }
                            }
                        });
                    } else {
                        context.log(timeDiffInMin);
                    }
                    if (timeDiffInMin >-32 && timeDiffInMin < -28) {
                        sendMail(file.sendgridKey, file.shutdownEmail.toEmail, file.shutdownEmail.fromEmail, file.shutdownEmail.scheduledSubject, file.shutdownEmail.scheduledBodyText, file.shutdownEmail.scheduledText,file.serverSchedule[i].instanceName);
                    }

                }

            });
        }
    });
    var stop_vm = function (resourcegrp, virtualmachine) {
        context.log("Now stopping ", resourcegrp, virtualmachine);
        computeClient.virtualMachines.deallocate(resourcegrp, virtualmachine, function (error) {
            if (error) {
                context.log(error);
            }
        });
    };

    var start_vm = function (resourcegrp, virtualmachine) {
        context.log("Now starting ", resourcegrp, virtualmachine);
        computeClient.virtualMachines.start(resourcegrp, virtualmachine, function (error) {
            if (error) {
                context.log(error);
            }
        });
    };
    var sendMail = function (sengridkey, toEmail, fromEmail, emailSubject, emailText, htmlText,serverName) {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(sengridkey);
        const msg = {
            to: toEmail,
            from: fromEmail,
            subject: emailSubject + serverName,
            text: emailText,
            html: emailText + htmlText,
        };
        sgMail.send(msg);
    }
    context.res = {
        body: bodyVal,
    };
    context.done();
};