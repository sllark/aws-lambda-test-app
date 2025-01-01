import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { TABLE_NAMES } from "../utils/tableNames.mjs";

// Create DynamoDB Client and Document Client
const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

// Utility function to validate ISO 8601 date-time
const isValidDateTime = (dateTime) => {
  const date = new Date(dateTime);
  return !isNaN(date.getTime()) && dateTime === date.toISOString();
};


/**
 * Lambda Function: postAlignment
 *
 * Purpose:
 * This function handles the creation of a new alignment session in the DynamoDB table.
 * It validates the input payload to ensure all required fields are present and correctly formatted.
 * On successful validation, it stores the alignment session in the DynamoDB table.
 *
 * Inputs:
 * - event: The API Gateway event object, which includes:
 *   - `httpMethod`: Must be "POST".
 *   - `body`: JSON string containing the alignment session details.
 *
 * Example Input Body:
 * {
 *   "alignmentId": "align001",
 *   "vehicleVin": "1HGCM82633A123456",
 *   "technicianId": "tech001",
 *   "startTime": "2024-12-31T21:35:13.174Z",
 *   "endTime": "2024-12-31T21:35:13.174Z",
 *   "status": "in-progress"
 * }
 *
 * Outputs:
 * - On Success:
 *   - HTTP 201 with a success message and the alignment session details.
 * - On Failure:
 *   - HTTP 400 for invalid inputs or missing fields.
 *   - HTTP 500 for internal server errors.
 *
 * Assumptions & Constraints:
 * - `alignmentId` must be unique for each session. Uniqueness is assumed to be handled at the DynamoDB level.
 * - The `startTime` and `endTime` fields must be valid ISO 8601 date-time strings.
 * - The `status` field must be one of: "in-progress", "completed".
 * - The `endTime` field is optional.
 */
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body);

    // Validate required fields
    const requiredFields = ["alignmentId", "vehicleVin", "technicianId", "startTime", "status"];
    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Invalid input. Missing required fields: ${missingFields.join(", ")}`,
        }),
      };
    }

    // Validate 'status' value
    const validStatuses = ["in-progress", "completed"];
    if (!validStatuses.includes(body.status)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: `Invalid 'status'. Must be one of: ${validStatuses.join(", ")}`,
        }),
      };
    }

    // Validate 'startTime' and 'endTime' (if provided)
    if (!isValidDateTime(body.startTime)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid 'startTime'. Must be a valid ISO 8601 date-time string.",
        }),
      };
    }

    if (body.endTime && !isValidDateTime(body.endTime)) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Invalid 'endTime'. Must be a valid ISO 8601 date-time string.",
        }),
      };
    }

    // Insert the alignment session into DynamoDB
    const params = {
      TableName: TABLE_NAMES.ALIGNMENT,
      Item: body,
    };

    await ddbDocClient.send(new PutCommand(params));

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Alignment session created successfully",
        data: body,
      }),
    };
  } catch (error) {
    console.error("Error in postAlignment:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
        error: error.message,
      }),
    };
  }
};