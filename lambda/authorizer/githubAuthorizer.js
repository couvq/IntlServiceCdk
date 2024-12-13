/* global fetch */
const { DynamoDBClient, QueryCommand } = require("@aws-sdk/client-dynamodb");

// Help function to generate an IAM policy
const generatePolicy = function (principalId, effect, resource) {
  var authResponse = {};

  authResponse.principalId = principalId;
  if (effect && resource) {
    var policyDocument = {};
    policyDocument.Version = "2012-10-17";
    policyDocument.Statement = [];
    var statementOne = {};
    statementOne.Action = "execute-api:Invoke";
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }

  // Optional output with custom properties of the String, Number or Boolean type.
  // todo - pretty sure I can use this to pass context over to the main lambda, useful for when I want to know user info
  authResponse.context = {
    stringKey: "stringval",
    numberKey: 123,
    booleanKey: true,
  };
  return authResponse;
};

/**
 * Class to make calls to github apis.
 */
class GithubClient {
  async fetchGithubUserFromToken(token) {
    const githubFetchParams = {
      method: "GET",
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        Authorization: `Bearer ${token}`,
      },
    };
    const githubUsersUrl = "https://api.github.com/user";
    const res = await fetch(githubUsersUrl, githubFetchParams);
    return res.json();
  }
}

// code built from aws example https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html#api-gateway-lambda-authorizer-token-lambda-function-create
exports.handler = async (event, context, callback) => {
  const githubToken = event.authorizationToken;
  if (!githubToken) callback("Unauthorized");
  console.log(`Github token received in request: ${githubToken}`);

  const githubClient = new GithubClient();
  const githubUser = await githubClient.fetchGithubUserFromToken(githubToken);
  if (!githubUser || !githubUser.id) callback("Unauthorized");

  console.log(
    `User is authenticated with github: ${JSON.stringify(githubUser)}`
  );

  const ddbInput = {
    ExpressionAttributeValues: {
      ":v1": {
        N: `${githubUser.id}`,
      },
    },
    KeyConditionExpression: "githubUserId = :v1",
    TableName: "GithubUsersTable",
  };
  const ddbClient = new DynamoDBClient();
  const command = new QueryCommand(ddbInput);
  const ddbResponse = await ddbClient.send(command);
  console.log(`Response from ddb: ${JSON.stringify(ddbResponse.Items)}`);
  if (!ddbResponse.Items.length)
    callback("Unauthorized: User has not onboarded to use the cli tool.");

  callback(null, generatePolicy("user", "Allow", event.methodArn));
};
