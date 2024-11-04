import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION
})
const documentClient = DynamoDBDocumentClient.from(client)

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    if (!isCreateTaskRequest(event.body)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Bad Request" })
        }
    }

    const createTaskRequest = JSON.parse(event.body) as CreateTaskRequest
    const task: Task = {
        id: Date.now().toLocaleString("en-US"),
        title: createTaskRequest.title,
        description: createTaskRequest.description,
        attachmentIds: [],
        complete: false
    }
    const command = new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: task
    })
    try {
        await documentClient.send(command)
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
};

function isCreateTaskRequest(request: any): request is CreateTaskRequest {
    if (!request) {
        return false
    }
    try {
        const createTaskRequest = JSON.parse(request)
        return 'title' in createTaskRequest && 'description' in createTaskRequest
    } catch (e) {
        return false
    }
}