import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { UpdateCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION
})
const documentClient = DynamoDBDocumentClient.from(client)

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    if (!isUpdateTaskRequest(event.body)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Bad Request" })
        }
    }
    const updateTaskRequest: UpdateTaskRequest = JSON.parse(event.body) as UpdateTaskRequest
    const updatedTask = {
        id: updateTaskRequest.id,
        title: updateTaskRequest.title,
        description: updateTaskRequest.description,
        complete: updateTaskRequest.complete
    }
    if (!updatedTask.title && !updatedTask.description && !updatedTask.complete) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Bad Request" })
        }
    }

    let updateExpression = "SET "
    if (updatedTask.title) {
        updateExpression += "title = :title,"
    }
    if (updatedTask.description) {
        updateExpression += "description = :description,"
    }
    if (updatedTask.complete) {
        updateExpression += "complete = :complete,"
    }
    updateExpression = updateExpression.slice(0, -1)

    const updateCommand = new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
            id: updatedTask.id
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: {
            ":title": updatedTask.title,
            ":description": updatedTask.description,
            ":complete": updatedTask.complete
        }
    })

    try {
        await documentClient.send(updateCommand)
    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" })
        }
    }
    return {
        statusCode: 200,
        body: JSON.stringify({ message: "OK" })
    }
}

const isUpdateTaskRequest = (request: any): request is UpdateTaskRequest => {
    if (!request) {
        return false
    }
    try {
        const updateTaskRequest = JSON.parse(request)
        return 'id' in updateTaskRequest
    } catch (e) {
        return false
    }
}