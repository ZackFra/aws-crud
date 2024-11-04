import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';
import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION
})
const documentClient = DynamoDBDocumentClient.from(client)

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const scanCommand = new ScanCommand({
        TableName: process.env.TABLE_NAME
    })
    try {
        const result = await documentClient.send(scanCommand)
        return {
            statusCode: 200,
            body: JSON.stringify(result.Items)
        }
    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal Server Error" })
        }
    }
}