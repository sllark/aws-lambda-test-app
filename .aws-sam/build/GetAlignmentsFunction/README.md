# AWS Lambda Alignments API

This project implements an AWS Lambda-based API for managing alignment sessions. It provides the following endpoints:

1. **POST `/alignments`**: Creates a new alignment session.
2. **GET `/alignments`**: Retrieves all alignment sessions or filters them by `technicianId`.

---

## Features

- Fully adheres to the provided Swagger specification.
- Detailed validation and error handling for all inputs.
- Automated deployment using AWS SAM (Serverless Application Model).
- Unit tests with Jest and aws-sdk-client-mock to ensure code reliability.

---

## Table of Contents

- [Instructions to Run Locally](#instructions-to-run-locally)
- [Instructions to Deploy](#instructions-to-deploy)
- [Instructions to Run Tests](#instructions-to-run-tests)
- [AWS Resources](#aws-resources)
- [Summary of Implementation](#summary-of-implementation)

---

## Instructions to Run Locally

You can run the Lambda functions locally using the **AWS SAM CLI**.

### Prerequisites

- Node.js and npm installed.
- AWS SAM CLI installed ([Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)).

### Steps

1. **Install Dependencies**  
   Run the following command to install required packages:
   ```bash
   npm install
   ```

2. **Build the SAM Application**

   Use the SAM CLI to build the application:
   ```bash
      sam build
      ```

3.	**Start the API Locally**
   
   Start the API Gateway simulation locally:
      ```bash
      sam local start-api
   ```


4.	**Test Locally**

      Use the following examples to test the API endpoints:
 
- POST /alignments:
   
   ```bash
   curl --request POST \
   --url http://127.0.0.1:3000/alignments \
   --header 'Content-Type: application/json' \
   --data '{
   "alignmentId": "align001",
   "vehicleVin": "1HGCM82633A123456",
   "technicianId": "tech001",
   "startTime": "2025-01-01T10:00:00Z",
   "status": "in-progress"
   }'
   ```
- GET /alignments:

   ```bash
   curl --request GET \
   --url http://127.0.0.1:3000/alignments?technicianId=tech001
   ```

## Instructions to Deploy

Deploy the API to AWS using AWS SAM.

### Steps
1.	**Deploy**
Run the following command to deploy the API:
      ```bash
        sam deploy --guided
      ```
      During deployment:
         - Provide a stack name (e.g., alignments-api).
         - Specify an AWS region.
         - Approve resource creation when prompted.

 
2.	**Note the API Gateway URL**

      After deployment, SAM will output the API Gateway endpoint. Use this URL to test the deployed API.

## Instructions to Run Tests

Unit tests are provided for both Lambda functions. These tests validate the following scenarios:
- Happy Paths: Valid requests and expected outputs.
- Edge Cases: Missing fields, invalid inputs, and DynamoDB errors.

### Steps to Run Tests
1.	**Install Dependencies**

      Run the following command to install required packages:

      ```bash
         npm install
      ```


2.	**Run Tests**

      Use Jest to execute the test cases:

      ```bash
         npm run test
      ```

3.	**Expected Output**

      All tests should pass, and Jest will display the results.

## AWS Resources

### Lambda Functions
1. **postAlignment:**
- Handles POST /alignments.
- Adds a new alignment session to the DynamoDB table.

2. **getAlignments:**
- Handles GET /alignments.
- Retrieves all alignments or filters by technicianId.

### API Gateway

| Method | Path | Linked Lambda |
|---	|---	|---	|
|   POST	| /alignments  	|   postAlignment	|
|   GET	|  /alignments 	|   getAlignments	|


#### IAM Policies
- DynamoDBCrudPolicy: For **postAlignment**.
- DynamoDBReadPolicy: For **getAlignments**.

## Summary of Implementation

### Implemented Features
- Lambda functions for POST /alignments and GET /alignments.
- Comprehensive input validation and error handling.
- Automated deployment with AWS SAM.

### Key Considerations
- Swagger specification followed for input and output formats.
- DynamoDB interactions are mock-tested.
- Least-privilege IAM policies used for Lambda permissions.

### Challenges
- Handling ES Module compatibility in Jest for aws-sdk-client-mock.
- Ensuring robust error handling for DynamoDB operations.

This implementation is complete and ready for deployment and testing.
