# NodeJS
export NODE_ENV=development

# APIC
export SKIP_LOGIN=true
export PORT=9022
export CATALOG_HOST=0.0.0.0:4002

# General
export GW_SECRET_HEADER=x-app-sharedsecret
export GW_SECRET=000000
export BASIC_AUTH_USER=NotUsed
export BASIC_AUTH_PASS=NotUsed

# Cloud Object Storage
export COS_ENDPOINT=https://s3.us-east.objectstorage.softlayer.net
export COS_API_KEY=DuNGVFOk8S9uTLBRHriXNomf0b-JcUxLZI9ADGXlUpVH
export COS_IBM_AUTH_ENDPOINT=https://iam.ng.bluemix.net/oidc/token
export COS_SERVICE_INSTANCE_ID=crn:v1:bluemix:public:cloud-object-storage:global:a/170d3f7e5a856289f8562a444df4c067:fda060df-5a2d-4aa8-824a-ce23d8b821a1:bucket:acmemartupload
export COS_ACME_MART_BUCKET_NAME=acmemartupload

# Cloudant Database
export CLOUDANT_DB_URL=https://89cb3cf8-3124-42b7-99ef-55725be14027-bluemix:746bc2b56d55ef88d281ade82f89c366e67cd29fc0ecfecfca3c25bc5f9b9867@89cb3cf8-3124-42b7-99ef-55725be14027-bluemix.cloudant.com

# Node-rdkafka NPM
export CPPFLAGS=-I/usr/local/opt/openssl/include
export LDFLAGS=-L/usr/local/opt/openssl/lib

# Event Streams
export EVENT_STREAMS_ON_CLOUD=true
export EVENT_STREAMS_CERT_LOCATION=./env/certs.pem
export EVENT_STREAMS_BROKER_SASL=kafka04-prod02.messagehub.services.eu-gb.bluemix.net:9093
export EVENT_STREAMS_ADMIN_URL=https://kafka-admin-prod02.messagehub.services.eu-gb.bluemix.net:443
export EVENT_STREAMS_API_KEY=JwOn2An7OpcLyBhg4mSdxe2rHi4jH1iP0GXW7aQ8fFnsASFA
export EVENT_STREAMS_NEW_ORDER_TOPIC_NAME=kafka-nodejs-console-sample-topic
export EVENT_STREAMS_UPDATE_ORDER_TOPIC_NAME=acmemart_update_order

# Watson Visual Recognition
export WVR_API_KEY=UxUJveg5rrqLNdzx5IO5TPUZkyQ8gWjcGsEnnWqA9L4b
export WVR_URL=https://gateway.watsonplatform.net/visual-recognition/api
export WVR_VERSION_DATE=2018-03-19
export WVR_CLASSIFIER_ID=AirJordans_1065097843


