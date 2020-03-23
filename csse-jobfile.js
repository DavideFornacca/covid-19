const path = require('path')
const moment = require('moment')
const program = require('commander')

// By default try to grap latest data
program
    .option('-d, --date [date]', 'Change the date of the data to be generated (defaults to yesterday)', moment().subtract(1, 'day').format('YYYY-MM-DD'))
    .parse(process.argv)

const date = moment(program.date)
if (!date.isValid()) {
  console.error('Invalid date, using yesterday as default')
  date = moment().subtract(1, 'day')
}

module.exports = {
  id: 'job',
  store: 'memory',
  tasks: [{
    id: `csse_covid_19_daily_report_${date.format('MM-DD-YYYY')}`,
    type: 'http',
    options: {
      url: `https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/${date.format('MM-DD-YYYY')}.csv`
    }
  }],
  hooks: {
    tasks: {
      after: {
        readCSV: {
          headers: true
        },
        convertToGeoJson: {
          latitude: 'Latitude',
          longitude: 'Longitude'
        },
        writeJsonFS: {
          hook: 'writeJson',
          store: 'fs'
        },
        writeJsonS3: {
          hook: 'writeJson',
          store: 's3',
          key: 'covid-19/csse_covid_19_daily_reports/<%= id %>.json',
          storageOptions: {
            ACL: 'public-read'
          }
        }
      }
    },
    jobs: {
      before: {
        createStores: [{
          id: 'memory'
        }, {
          id: 'fs',
          options: { path: path.join(__dirname, 'csse_covid_19_daily_reports') }
        },
        {
          id: 's3',
          options: {
            client: {
              accessKeyId: process.env.S3_ACCESS_KEY,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
            },
            bucket: process.env.S3_BUCKET
          }
        }]
      },
      after: {
        clearOutputs: {},
        removeStores: ['memory', 'fs', 's3']
      }
    }
  }
}
