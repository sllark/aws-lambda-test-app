import 'aws-sdk-client-mock-jest';
import { mockClient } from "aws-sdk-client-mock";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { handler as postAlignment } from "../../../src/handlers/postAlignment.mjs";
import {jest} from "@jest/globals";

jest.useFakeTimers()

// Mock the DynamoDBDocumentClient
const ddbMock = mockClient(DynamoDBDocumentClient);

describe("postAlignment Lambda Function", () => {
  beforeEach(() => {
    ddbMock.reset(); // Reset the mock for a clean slate
  });

  afterAll(() => {
    ddbMock.restore(); // Clean up resources after all tests
  });

  test("Happy Path: Should create an alignment successfully", async () => {
    // Mock successful DynamoDB response
    ddbMock.on(PutCommand).resolves({});

    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        alignmentId: "align001",
        vehicleVin: "1HGCM82633A123456",
        technicianId: "tech001",
        startTime: "2025-01-01T10:00:00.000Z",
        status: "in-progress",
      }),
    };

    const response = await postAlignment(event);

    // Assertions
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body).message).toBe("Alignment session created successfully");
    expect(ddbMock).toHaveReceivedCommandTimes(PutCommand, 1); // Ensure PutCommand was called once
    expect(ddbMock).toHaveReceivedCommandWith(PutCommand, {
      TableName: "alignments_table", // Match your table name
      Item: expect.objectContaining({
        alignmentId: "align001",
        vehicleVin: "1HGCM82633A123456",
        technicianId: "tech001",
        startTime: "2025-01-01T10:00:00.000Z",
        status: "in-progress",
      }),
    });
  });

  test("Edge Case: Should return 400 for missing required fields", async () => {
    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        vehicleVin: "1HGCM82633A123456",
        technicianId: "tech001",
        startTime: "2025-01-01T10:00:00.000Z",
      }),
    };

    const response = await postAlignment(event);

    // Assertions
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toContain("Missing required fields");
    expect(ddbMock).toHaveReceivedCommandTimes(PutCommand, 0); // Ensure no DynamoDB call was made
  });

  test("Edge Case: Should return 400 for invalid date format", async () => {
    const event = {
      httpMethod: "POST",
      body: JSON.stringify({
        alignmentId: "align001",
        vehicleVin: "1HGCM82633A123456",
        technicianId: "tech001",
        startTime: "invalid-date",
        status: "in-progress",
      }),
    };

    const response = await postAlignment(event);

    // Assertions
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe(
      "Invalid 'startTime'. Must be a valid ISO 8601 date-time string."
    );
    expect(ddbMock).toHaveReceivedCommandTimes(PutCommand, 0); // Ensure no DynamoDB call was made
  });

  test("Edge Case: Should return 405 for incorrect HTTP method", async () => {
    const event = {
      httpMethod: "GET", // Invalid method
      body: JSON.stringify({
        alignmentId: "align001",
        vehicleVin: "1HGCM82633A123456",
        technicianId: "tech001",
        startTime: "2025-01-01T10:00:00.000Z",
        status: "in-progress",
      }),
    };

    const response = await postAlignment(event);

    // Assertions
    expect(response.statusCode).toBe(405);
    expect(JSON.parse(response.body).message).toBe("Method not allowed");
    expect(ddbMock).toHaveReceivedCommandTimes(PutCommand, 0); // Ensure no DynamoDB call was made
  });
});
