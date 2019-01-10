# Dockerfile to run the sample under current Node LTS
#
# docker build . -t acmemartutilityapi
# docker run --rm -it -p 3000:3000 acmemartutilityapi
#
FROM ubuntu

RUN  apt-get update -qqy \
  && apt-get install -y --no-install-recommends \
     build-essential \
     node-gyp \
     nodejs-dev \
     libssl1.0-dev \
     liblz4-dev \
     libpthread-stubs0-dev \
     libsasl2-dev \
     libsasl2-modules \
     make \
     python \
     nodejs npm ca-certificates \
  && rm -rf /var/cache/apt/* /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY . /usr/src/app/

RUN npm install -d
ENV NODE_ENV=development
ENV GW_SECRET_HEADER=f84hN8fhdncv9fjD
ENV SKIP_LOGIN=true
ENV BASIC_AUTH_USER=NotUsed
ENV BASIC_AUTH_PASS=NotUsed
ENV LD_LIBRARY_PATH=/usr/src/app/node_modules/node-rdkafka/build/deps
ENV CPPFLAGS=-I/usr/local/opt/openssl/include
ENV LDFLAGS=-L/usr/local/opt/openssl/lib
ENV COM_ENDPOINT=https://s3.us-east.objectstorage.softlayer.net
ENV COM_API_KEY=DuNGVFOk8S9uTLBRHriXNomf0b-JcUxLZI9ADGXlUpVH
ENV COM_IBM_AUTH_ENDPOINT=https://iam.ng.bluemix.net/oidc/token
ENV COM_SERVICE_INSTANCE_ID=crn:v1:bluemix:public:cloud-object-storage:global:a/170d3f7e5a856289f8562a444df4c067:fda060df-5a2d-4aa8-824a-ce23d8b821a1:bucket:acmemartupload
ENV COM_ACME_MART_BUCKET_NAME=acmemartupload
ENV CLOUDANT_DB_URL=https://89cb3cf8-3124-42b7-99ef-55725be14027-bluemix:746bc2b56d55ef88d281ade82f89c366e67cd29fc0ecfecfca3c25bc5f9b9867@89cb3cf8-3124-42b7-99ef-55725be14027-bluemix.cloudant.com
ENV EVENT_STREAMS_NEW_ORDER_TOPIC_NAME=kafka-nodejs-console-sample-topic
ENV EVENT_STREAMS_UPDATE_ORDER_TOPIC_NAME=acmemart_update_order
ENV EVENT_STREAMS_BROKER_SASL=kafka04-prod02.messagehub.services.eu-gb.bluemix.net:9093
ENV EVENT_STREAMS_ADMIN_URL=https://kafka-admin-prod02.messagehub.services.eu-gb.bluemix.net:443
ENV EVENT_STREAMS_API_KEY=JwOn2An7OpcLyBhg4mSdxe2rHi4jH1iP0GXW7aQ8fFnsASFA
ENV EVENT_STREAMS_CERT_LOCATION=/etc/ssl/certs
ENV EVENT_STREAMS_ON_CLOUD=false
ENV WVR_API_KEY=UxUJveg5rrqLNdzx5IO5TPUZkyQ8gWjcGsEnnWqA9L4b
ENV WVR_URL=https://gateway.watsonplatform.net/visual-recognition/api
ENV WVR_VERSION_DATE=2018-03-19
ENV WVR_CLASSIFIER_ID=AirJordans_1065097843
ENV CATALOG_HOST=0.0.0.0:4002

EXPOSE 3000

ENTRYPOINT [ "node", "server/server.js" ]
CMD [ "" ]
