import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as apiGateway from 'aws-cdk-lib/aws-apigateway'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class TodoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const attachmentsBucket = new s3.Bucket(this, 'attachments')

    const taskTable = new dynamodb.TableV2(this, 'tasks', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const createTaskFn = new lambda.Function(this, 'create-task', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/create-task'),
      environment: {
        TABLE_NAME: taskTable.tableName,
      }
    })

    const updateTaskFn = new lambda.Function(this, 'update-task', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/update-task'),
      environment: {
        TABLE_NAME: taskTable.tableName,
      }
    })

    const viewTasksFn = new lambda.Function(this, 'view-tasks', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/view-tasks'),
      environment: {
        TABLE_NAME: taskTable.tableName,
      }
    })
    const deleteTaskFn = new lambda.Function(this, 'delete-task', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/delete-task'),
      environment: {
        TABLE_NAME: taskTable.tableName,
      }
    })
    const uploadAttachmentFn = new lambda.Function(this, 'upload-attachment', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/upload-attachment'),
      environment: {
        TABLE_NAME: taskTable.tableName,
        BUCKET_NAME: attachmentsBucket.bucketName
      }
    })
    const removeAttachmentFn = new lambda.Function(this, 'remove-attachment', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/remove-attachment'),
      environment: {
        TABLE_NAME: taskTable.tableName,
      }
    })

    /** permissiones  */
    taskTable.grantReadWriteData(removeAttachmentFn)

    attachmentsBucket.grantPut(uploadAttachmentFn)
    taskTable.grantReadWriteData(uploadAttachmentFn)

    taskTable.grantWriteData(deleteTaskFn)
    taskTable.grantReadData(viewTasksFn)
    taskTable.grantWriteData(updateTaskFn)
    taskTable.grantWriteData(createTaskFn)

    /** API Gateway */
    const api = new apiGateway.RestApi(this, 'todo-api', {
      restApiName: 'Todo Service',
      description: 'This service serves todos.'
    });

    const tasks = api.root.addResource('tasks')
    const attachments = api.root.addResource('attachments')

    const createTaskIntegration = new apiGateway.LambdaIntegration(createTaskFn)
    tasks.addMethod('POST', createTaskIntegration)

    const viewTasksIntegration = new apiGateway.LambdaIntegration(viewTasksFn)
    tasks.addMethod('GET', viewTasksIntegration)

    const updateTaskIntegration = new apiGateway.LambdaIntegration(updateTaskFn)
    tasks.addMethod('PUT', updateTaskIntegration)

    const deleteTaskIntegration = new apiGateway.LambdaIntegration(deleteTaskFn)
    tasks.addMethod('DELETE', deleteTaskIntegration)

    const uploadAttachmentIntegration = new apiGateway.LambdaIntegration(uploadAttachmentFn)
    attachments.addMethod('POST', uploadAttachmentIntegration)

    const removeAttachmentIntegration = new apiGateway.LambdaIntegration(removeAttachmentFn)
    attachments.addMethod('DELETE', removeAttachmentIntegration)

  }
}