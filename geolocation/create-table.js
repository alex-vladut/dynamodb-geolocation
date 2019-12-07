const AWS = require('aws-sdk')
AWS.config.update({ region: 'eu-central-1' })

const ddb = new AWS.DynamoDB()
const ddbGeo = require('dynamodb-geo');

exports.lambdaHandler = async (event, context) => {
  // Pick a hashKeyLength appropriate to your usage
  const config = new ddbGeo.GeoDataManagerConfiguration(ddb, 'geo-activities');
  config.hashKeyLength = 5;

  // Use GeoTableUtil to help construct a CreateTableInput.
  const createTableInput = ddbGeo.GeoTableUtil.getCreateTableRequest(config);

  console.log('Creating table with schema:');
  console.dir(createTableInput, { depth: null });

  await ddb.createTable(createTableInput).promise();
  await ddb.waitFor('tableExists', { TableName: config.tableName }).promise();
  console.log('Table created and ready!')
  return {};
};
