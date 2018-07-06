# AcloudManage (Azure Cloud Mange)

A simple Azure function to manage Azure cloud instances,it allows users to schedule VM startup and shutdown process, email notifications are provided usinng [Sendgrid](https://sendgrid.com/docs).

VM config info will be provided as input in a YML file, including starup and shutdown timings.

## Features

- Schedule server startup/shutdown
- Send emails before startup/shutdown
- Send reminder emails

## Usage

Login to Azure PS and create a function app

```
az functionapp create --name <function App name> --storage-account <storage account> --consumption-plan-location <location/eastus> --resource-group <resource group name>
```
> Note: If you get an error try changing the functionapp name

after creating the function app , deploy the app from github directly.

```
az functionapp deployment source config --name <function App name> --resource-group <resource group name> --branch master --repo-url https://github.com/nandakola/aCloudManage --manual-integration
```
hang on tight , it will take sometime... once the dpeloyment is completed got to Azure portal and stop the app , we need to update the Azure configuration before we run it.

Azure function app screen you will find an URL to the function app, copy that it will look something like bellow.

>https:// /{functionAppname}.azurewebsites.net

Add .scm after functionappname and access [kudu](https://github.com/projectkudu/kudu) url.

>https:// /{functionAppname}.scm.azurewebsites.net

once you are in kudu click on "Debug console" -> "PowerShell" this will allow you to browse the site assets that you deployed using az command.

now go to "site" -> "wwwroot" -> "aManageTrigger "  and click edit button for  "amcloud.yml" this is where most of the configurations are, you need to update this while with your severs information annd start/stop timings.

apart form this there is one more configuration that u"ll need to updat is on local.settings.json which will be in project root folder ("site" -> "wwwroot") . i think apart form httpstrigger type function all other function types need a storage account. Update "AzureWebJobsStorage" value with one storage URL form your account. ---> rest of the app configuration is in the next section.

## Configuration

After Git pull update the YML `amcloud.yml` file in the "amanageTrigger" folder with the Azure account info.

Login to Azure PS (i tried on CLOUD PS).
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
Register with sendgrid and update the sendgridKey.
```
sendgridKey : <sendgridKey>
```

Update the VM info under serverSchedule in YML file(One object per insatnce).

```
serverSchedule:
  - instanceName : <Instance Name>
    resourceGroupName : <Resource Group of the Instance>
    startTime : "12:20" #in quotes 24 hr format
    shutDownTime: "12:30" #in quotes 24 hr format
    includeWeekends : true # Not yet implimented
    enable : true
  
  - instanceName : 
    resourceGroupName : 
    startTime : "12:20" #in quotes 24 hr format
    shutDownTime: "12:30" #in quotes 24 hr format
    includeWeekends : true # Not yet implimented
    enable : true

    ....
```
Finally update email config info as per your requirements, right now AcloudManage is scheduled to send an email before the server startup/shutdown and one email as a remainder just before the 30 mins of the schedule startup/shutdown.(Its hard coded feel free to modify according to your requirements.)

# About Azure TimerTrigger - JavaScript

The `TimerTrigger` makes it incredibly easy to have your functions executed on a schedule. This sample demonstrates a simple use case of calling your function every 5 minutes.

## How it works

For a `TimerTrigger` to work, you provide a schedule in the form of a [cron expression](https://en.wikipedia.org/wiki/Cron#CRON_expression)(See the link for full details). A cron expression is a string with 6 separate expressions which represent a given schedule via patterns. The pattern we use to represent every 5 minutes is `0 */5 * * * *`. This, in plain text, means: "When seconds is equal to 0, minutes is divisible by 5, for any hour, day of the month, month, day of the week, or year".

