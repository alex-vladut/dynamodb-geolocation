const AWS = require('aws-sdk')
AWS.config.update({ region: 'eu-central-1' })

const ddb = new AWS.DynamoDB()
const ddbGeo = require('dynamodb-geo');
const config = new ddbGeo.GeoDataManagerConfiguration(ddb, 'geo-activities')
config.hashKeyLength = 5

const myGeoTableManager = new ddbGeo.GeoDataManager(config)

exports.lambdaHandler = async (event) => {
  return await myGeoTableManager.queryRadius({
    RadiusInMeter: event.radius,
    CenterPoint: {
      latitude: event.latitude,
      longitude: event.longitude
    }
  })
};
