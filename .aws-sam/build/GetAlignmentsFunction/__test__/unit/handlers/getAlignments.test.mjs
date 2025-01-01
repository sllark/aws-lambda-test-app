import 'aws-sdk-client-mock-jest';
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { handler as getAlignments } from "../../../src/handlers/getAlignments.mjs";
import {jest} from "@jest/globals";

jest.useFakeTimers()
// Mock the DynamoDBDocumentClient
const ddbMock = mockClient(DynamoDBDocumentClient);

describe("getAlignments Lambda Function", () => {
  beforeEach(() => {
    ddbMock.reset(); // Reset the mock for a clean slate
  });

  afterAll(() => {
    ddbMock.restore(); // Clean up resources after all tests
  });

  test("Happy Path: Should retrieve all alignments", async () => {
    // Mock DynamoDB response
    ddbMock.on(ScanCommand).resolves({
      Items: [
        {
          alignmentId: "align001",
          vehicleVin: "1HGCM82633A123456",
          technicianId: "tech001",
          startTime: "2025-01-01T10:00:00.000Z",
          status: "in-progress",
        },
      ],
    });

    const event = {
      httpMethod: "GET",
      queryStringParameters: null,
    };

    const response = await getAlignments(event);

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe("Alignments retrieved successfully");
    expect(JSON.parse(response.body).data).toHaveLength(1);
    expect(ddbMock).toHaveReceivedCommandTimes(ScanCommand, 1); // Ensure ScanCommand was called once
    expect(ddbMock).toHaveReceivedCommandWith(ScanCommand, {
      TableName: "alignments_table", // Match your table name
    });
  });

  test("Edge Case: Should retrieve alignments filtered by technicianId", async () => {
    // Mock DynamoDB response
    ddbMock.on(ScanCommand).resolves({
      Items: [
        {
          alignmentId: "align001",
          vehicleVin: "1HGCM82633A123456",
          technicianId: "tech001",
          startTime: "2025-01-01T10:00:00.000Z",
          status: "in-progress",
        },
      ],
    });

    const event = {
      httpMethod: "GET",
      queryStringParameters: { technicianId: "tech001" },
    };

    const response = await getAlignments(event);

    // Assertions
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe("Alignments retrieved successfully");
    expect(JSON.parse(response.body).data).toHaveLength(1);
    expect(ddbMock).toHaveReceivedCommandTimes(ScanCommand, 1); // Ensure ScanCommand was called once
    expect(ddbMock).toHaveReceivedCommandWith(ScanCommand, {
      TableName: "alignments_table", // Match your table name
      FilterExpression: "technicianId = :technicianId",
      ExpressionAttributeValues: {
        ":technicianId": "tech001",
      },
    });
  });

  test("Edge Case: Should return 405 for incorrect HTTP method", async () => {
    const event = {
      httpMethod: "POST", // Invalid method
      queryStringParameters: null,
    };

    const response = await getAlignments(event);

    // Assertions
    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body).message).toBe("Method not allowed");
    expect(ddbMock).toHaveReceivedCommandTimes(ScanCommand, 0); // Ensure no DynamoDB call was made
  });

  test("Edge Case: Should handle DynamoDB errors gracefully", async () => {
    // Mock DynamoDB to throw an error
    ddbMock.on(ScanCommand).rejects(new Error("DynamoDB error"));

    const event = {
      httpMethod: "GET",
      queryStringParameters: null,
    };

    const response = await getAlignments(event);

    // Assertions
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe("Internal server error");
    expect(JSON.parse(response.body).error).toBe("DynamoDB error");
  });
});
