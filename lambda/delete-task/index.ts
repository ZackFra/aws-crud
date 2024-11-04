import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { DeleteCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION
})
const documentClient = DynamoDBDocumentClient.from(client)

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    if (!isDeleteTaskRequest(event.body)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Bad Request" })
        }
    }

    const deleteTaskRequest = JSON.parse(event.body) as DeleteTaskRequest
    const deleteCommand = new DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
            id: deleteTaskRequest.id
        }
    })
    try {
        await documentClient.send(deleteCommand)
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

const isDeleteTaskRequest = (request: any): request is DeleteTaskRequest => {
    if (!request) {
        return false
    }
    try {
        const deleteTaskRequest = JSON.parse(request)
        return 'id' in deleteTaskRequest
    } catch (e) {
        return false
    }
}