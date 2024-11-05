import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { UpdateCommand, ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION
})
const documentClient = DynamoDBDocumentClient.from(client)

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    if (!isRemoveAttachmentRequest(event.body)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Bad Request" })
        }
    }
    const removeAttachmentRequest: RemoveAttachmentRequest = JSON.parse(event.body) as RemoveAttachmentRequest

    const scanCommand: ScanCommand = new ScanCommand({
        TableName: process.env.TABLE_NAME,
        FilterExpression: "id = :id",
        ExpressionAttributeValues: {
            ":id": removeAttachmentRequest.taskId
        }
    })

    let task: Task
    try {
        const response = await documentClient.send(scanCommand)
        task = response.Items?.[0] as Task
        if (!task) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Not Found" })
            }
        }
    } catch (e) {
        console.error(e)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" })
        }
    }

    const updateCommand = new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
            id: removeAttachmentRequest.taskId
        },
        UpdateExpression: "REMOVE attachmentIds[" + task.attachmentIds.indexOf(removeAttachmentRequest.fileName) + "]"
    })
    try {
        await documentClient.send(updateCommand)
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "OK" })
        }
    } catch (e) {
        console.error(e)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" })
        }
    }
}

const isRemoveAttachmentRequest = (request: any): request is RemoveAttachmentRequest => {
    if (!request) {
        return false
    }
    try {
        const removeAttachmentRequest = JSON.parse(request)
        return 'taskId' in removeAttachmentRequest && 'fileName' in removeAttachmentRequest
    } catch (e) {
        return false
    }
}