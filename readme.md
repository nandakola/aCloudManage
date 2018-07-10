# AcloudManage (Azure Cloud Mange)

A simple Azure function to manage Azure cloud instances,it allows users to schedule VM startup and shutdown process and send notification emails before stratup/shutdown.Notifications are provided using [Sendgrid](https://sendgrid.com/docs).

VM config info will be provided as input in a YML file, including startup and shutdown timings.

## Features

- Schedule server startup/shutdown
- Send emails before startup/shutdown
- Send reminder emails
- Weekend enable/disable schedule
- Change the startup/shutdown config via kudu anytime.

## Usage

Login to Azure CLI and create a function app

```
az functionapp create --name <function App name> --storage-account <storage account> --consumption-plan-location <location/eastus> --resource-group <resource group name>
```
> Note: If you get an error try changing the functionapp name

After creating the function app , deploy the app from github directly.

```
az functionapp deployment source config --name <function App name> --resource-group <resource group name> --branch master --repo-url https://github.com/nandakola/aCloudManage --manual-integration
```
Hang on tight, it will take sometime... once the deployment is completed got to Azure portal and stop the app, we need to update the Azure configuration before we run it.

Azure function app screen you will find an URL to the function app, copy that it will look something like bellow.

>https:// /{functionAppname}.azurewebsites.net

Add .scm after functionappname and access [kudu](https://github.com/projectkudu/kudu) url.

>https:// /{functionAppname}.scm.azurewebsites.net

once you are in kudu click on "Debug console" -> "PowerShell" this will allow you to browse the site assets that you deployed using Azure CLI.

now go to "site" -> "wwwroot" -> "aManageTrigger"  and click edit button for  "amcloud.yml" this is where most of the configurations are, you need to update this with your severs information and start/stop timings. Below configuration talks about on how to update this file.


## Configuration

After Git pull update the YML `amcloud.yml` file in the "amanageTrigger" folder with the Azure account info.

Login to Azure CLI (i tried on CLOUD PS).
Create a service principal and configure its access to Azure resources and copy the results.

```
Azure:\
PS Azure:\> az ad sp create-for-rbac --sdk-auth
```
Update the following config parmeters from the output.

```
clientId : '<clientId>'
domain : '<tenantId>'
secret : '<clientSecret>'
subscriptionId : '<subscriptionId>'
```
service principle allows the app to  deploy or configure resources through Azure Resource Manager in Azure Stack, in our case we are trying to manipulate the state of the resource.

To send emails form the function we need to Register with sendgrid and update the sendgridKey.
```
sendgridKey : <sendgridKey>
```

Now finally add the resources that you would like to controll using this fucntion, all parameters are mandatory.

```
serverSchedule:
  - instanceName : <Instance Name>
    resourceGroupName : <Resource Group of the Instance>
    startTime : "12:20" #in quotes 24 hr format
    shutDownTime: "12:30" #in quotes 24 hr format
    includeWeekends : true # change it to false to disable the schedule on weekends
    enable : true
  
  - instanceName : 
    resourceGroupName : 
    startTime : "12:20" #in quotes 24 hr format
    shutDownTime: "12:30" #in quotes 24 hr format
    includeWeekends : true # change it to false to disable the schedule on weekends
    enable : true # Not yet implimented

    ....
```
Update email config info as per your requirements, right now AcloudManage is scheduled to send an email before the server startup/shutdown and one email as a remainder just before the 30 mins of the schedule startup/shutdown.(Its hard coded feel free to modify according to your requirements.)

Finally update the "AzureWebJobsStorage" parameter in "local.settings.json" with one storage URL form your account.(this is the only configuration outside amcloud.yml)

>Note : function runs in UTC , if you want to run it in your time zone add the time zone parameter to azure app settings. Ex : Azure app Application settings, i added “WEBSITE_TIME_ZONE” : "Eastern Standard Time"

login to Azure portal and start the fucntion, if you wnat to chnage the scheduled time simply login to kudu and change it , no need to stop the function.

# About Azure TimerTrigger - JavaScript

The `TimerTrigger` makes it incredibly easy to have your functions executed on a schedule. This sample demonstrates a simple use case of calling your function every 5 minutes.

## How it works

For a `TimerTrigger` to work, you provide a schedule in the form of a [cron expression](https://en.wikipedia.org/wiki/Cron#CRON_expression)(See the link for full details). A cron expression is a string with 6 separate expressions which represent a given schedule via patterns. The pattern we use to represent every 5 minutes is `0 */5 * * * *`. This, in plain text, means: "When seconds is equal to 0, minutes is divisible by 5, for any hour, day of the month, month, day of the week, or year".

