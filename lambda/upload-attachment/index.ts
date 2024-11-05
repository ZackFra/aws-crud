import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { UpdateCommand, ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION
})
const documentClient = DynamoDBDocumentClient.from(dynamoClient)
const s3Client = new S3Client({
    region: process.env.AWS_REGION
})

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    if (!isUpdateAttachmentRequest(event.body)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Bad Request" })
        }
    }
    const uploadAttachmentRequest: UploadAttachmentRequest = JSON.parse(event.body) as UploadAttachmentRequest

    let task: Task
    try {
        task = await scanTaskById(uploadAttachmentRequest.taskId)
    } catch (e) {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: "Not Found" })
        }
    }

    const putObjectCommand = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: uploadAttachmentRequest.fileName,
        Body: uploadAttachmentRequest.attachment
    })
    try {
        await s3Client.send(putObjectCommand)
    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" })
        }
    }
    let attachmentIds: string[] = []
    if (task.attachmentIds) {
        attachmentIds = [...task.attachmentIds]
    }
    if (!attachmentIds.includes(uploadAttachmentRequest.fileName)) {
        attachmentIds.push(uploadAttachmentRequest.fileName)
    }
    const updateCommand = new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
            id: uploadAttachmentRequest.taskId
        },
        UpdateExpression: "SET attachmentIds = :attachmentIds",
        ExpressionAttributeValues: {
            ":attachmentIds": attachmentIds
        }
    })
    try {
        await documentClient.send(updateCommand)
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "OK" })
        }
    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" })
        }
    }
}

const scanTaskById = async (id: string): Promise<Task> => {
    const scanCommand = new ScanCommand({
        TableName: process.env.TABLE_NAME,
        FilterExpression: "id = :id",
        ExpressionAttributeValues: {
            ":id": id
        }
    })
    const result = await documentClient.send(scanCommand)
    if (!result.Items || result.Items.length === 0) {
        throw new Error("Not Found")
    }
    return result.Items[0] as Task
}

const isUpdateAttachmentRequest = (request: any): request is UploadAttachmentRequest => {
    if (!request) {
        return false
    }
    try {
        const updateAttachmentRequest = JSON.parse(request)
        return 'taskId' in updateAttachmentRequest && 'attachment' in updateAttachmentRequest && 'fileName' in updateAttachmentRequest
    } catch (e) {
        return false
    }
}