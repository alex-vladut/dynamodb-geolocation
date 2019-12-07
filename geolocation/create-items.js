const uuid = require('uuid');
const AWS = require('aws-sdk')
AWS.config.update({ region: 'eu-central-1' })

const ddb = new AWS.DynamoDB()
const ddbGeo = require('dynamodb-geo');
const config = new ddbGeo.GeoDataManagerConfiguration(ddb, 'geo-activities')
config.hashKeyLength = 5

const myGeoTableManager = new ddbGeo.GeoDataManager(config)

exports.lambdaHandler = async (event) => {
  const data = event.items;

  const putPointInputs = data.map(function (location) {
    return {
      RangeKeyValue: { S: uuid.v4() },
      GeoPoint: {
        latitude: location.position.lat,
        longitude: location.position.lng
      },
      PutItemInput: {
        Item: {
          name: { S: location.name },
          address: { S: location.address }
        }
      }
    }
  })

  const BATCH_SIZE = 25
  const WAIT_BETWEEN_BATCHES_MS = 1000
  let currentBatch = 1

  const resumeWriting = async () => {
    if (putPointInputs.length === 0) return Promise.resolve()
    const thisBatch = []
    for (let i = 0, itemToAdd = null; i < BATCH_SIZE && (itemToAdd = putPointInputs.shift()); i++) {
      thisBatch.push(itemToAdd)
    }
    console.log('Writing batch ' + (currentBatch++) + '/' + Math.ceil(data.length / BATCH_SIZE))

    return myGeoTableManager.batchWritePoints(thisBatch).promise()
      .then(function () {
        return new Promise(function (resolve) {
          setInterval(resolve, WAIT_BETWEEN_BATCHES_MS)
        })
      })
      .then(function () {
        return resumeWriting()
      })
  }
  return await resumeWriting();
};
