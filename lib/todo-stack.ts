import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3'
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
    attachmentsBucket.grantPut(uploadAttachmentFn)
    taskTable.grantReadWriteData(uploadAttachmentFn)

    taskTable.grantWriteData(deleteTaskFn)
    taskTable.grantReadData(viewTasksFn)
    taskTable.grantWriteData(updateTaskFn)
    taskTable.grantWriteData(createTaskFn)
  }
}