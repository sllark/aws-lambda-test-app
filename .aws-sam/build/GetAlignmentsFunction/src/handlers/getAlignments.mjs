import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { TABLE_NAMES } from "../utils/tableNames.mjs";

// Create DynamoDB Client and Document Client
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);


/**
 * Lambda Function: getAlignments
 *
 * Purpose:
 * This function retrieves alignment sessions from the DynamoDB table.
 * It supports optional filtering by `technicianId` to return alignments associated with a specific technician.
 *
 * Inputs:
 * - event: The API Gateway event object, which includes:
 *   - `httpMethod`: Must be "GET".
 *   - `queryStringParameters.technicianId` (optional): A string representing the technician ID to filter results.
 *
 * Outputs:
 * - On Success:
 *   - HTTP 200 with a list of alignment sessions (optionally filtered by `technicianId`).
 * - On Failure:
 *   - HTTP 400 for invalid inputs.
 *   - HTTP 500 for internal server errors.
 *
 * Assumptions & Constraints:
 * - If no `technicianId` is provided, the function retrieves all alignments.
 * - The DynamoDB table is assumed to contain a `technicianId` attribute for filtering.
 * - Pagination is not implemented in this version and may be needed for large datasets.
 */
export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const technicianId = event.queryStringParameters?.technicianId;

    let params;
    if (technicianId) {
      params = {
        TableName: TABLE_NAMES.ALIGNMENT,
        FilterExpression: "technicianId = :technicianId",
        ExpressionAttributeValues: {
          ":technicianId": technicianId,
        },
      };
    } else {
      params = {
        TableName: TABLE_NAMES.ALIGNMENT,
      };
    }

    // Scan the DynamoDB table
    const result = await ddbDocClient.send(new ScanCommand(params));
    const alignments = result.Items || [];

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Alignments retrieved successfully",
        data: alignments,
      }),
    };
  } catch (error) {
    console.error("Error in getAlignments:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};