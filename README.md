# Radiation Tracking

Part of the Big Data, TUHH, SoSe, 2024. Group M3.

## Data Processing

Apache Kafka forms the core of our radiation tracking system. It's configured within a Docker environment for easy deployment and scalability. The producer is developoed using python and can be run as a juypiter file. The real_time_data_simulation.cs is a file that is constantly being added entries like real data by the data_streaming script to simmulate a real-life streaming experience.

## Middleware Application

Python Flask is used ot build the middleware. On this folder the consumer can be found as well as the api build to return the data to the fornend.

## Frontend

The frontend is developed with ReactJS and is used for user interactions.

## Steps to Run Locally in VSCode

1. On the root folder run: `docker-compose up -d`
2. Open the data_streaming.ipynb file and run the code blocks
3. Open kafka_data_provider.ipynb and run the code block
4. Make sure that the topic name is consistent on the kafka_data_provider.ipynb and on the files app.py and kafka_consumer.py
5. Navigate to the folder middleware on the temrinal and run: `pip install requirements.txt`
6. `Run: python app.py`
7. On a new teminal navigate to frontend and run `npm install`
8. Run `npm start`

Now the system will be running

## Steps to compose kafka and other dependencies(docker-compose.yml)

1. Navigate to folder where docker-compose.yml file is placed
2. open new terminal
3. type "docker-compose up -d" and run

## Steps to publish data to kafka topics

1. open new terminal
2. cd producer
3. run 1st cell to load the libraries
4. run 2nd cell to push data into kafka topic

## Getting the Containers form docker hub

The containers of this project are pushed to a docker hub repository [big-data-m3](https://hub.docker.com/repository/docker/leartajanuzi/big-data-m3/general)

1. Go to the registry and pull the images.
2. Run `docker-compose build`
3. Run `docker-compose up -d`

You must have the images on your fileshare now.

## Deployment

[GKE](https://cloud.google.com/kubernetes-engine/?hl=en) is used for cloud deployment. Container images are required by Kubernetes, for which we have Docker files for each service. Deployment is a job that is a one-time activity to deploy smart contracts on the blockchain. The container images must be stored in an artifact registry, for which we use [Artifact Registry](https://cloud.google.com/artifact-registry).

### Prerequisites

1. Install Google SDK.
2. Run `gcloud auth login` to log in to your Google account with cloud access and set the project ID.

### Artifact Registry Setup

1. Go to the Artifact Registry in the Console and click the "+" button at the top.
2. Name: `repository-name`
3. Format: Docker
4. Location Type: Region
5. Region: Choose one, e.g., `europe-west10`
6. Run `gcloud auth configure-docker europe-west10-docker.pkg.dev` in your shell. This makes Docker push work.

### Build and Push to Registry

1. `export IMAGE_TAG=europe-west10-docker.pkg.dev/gcloud_projectid/repository-name/zookeeper`
2. `export IMAGE_TAG_1=europe-west10-docker.pkg.dev/gcloud_projectid/repository-name/kafka`
3. `export IMAGE_TAG_2=europe-west10-docker.pkg.dev/gcloud_projectid/repository-name/backend`
4. `export IMAGE_TAG_3=europe-west10-docker.pkg.dev/gcloud_projectid/repository-name/middleware`
5. `export IMAGE_TAG_4=europe-west10-docker.pkg.dev/gcloud_projectid/repository-name/frontend`
6. Build and push Zookeeper image:
   - `docker build -t $IMAGE_TAG -f Dockerfile.zookeeper --platform linux/x86_64 .`
   - `docker push $IMAGE_TAG`
7. Build and push Kafka image:
   - `docker build -t $IMAGE_TAG_1 -f Dockerfile.kafka --platform linux/x86_64 .`
   - `docker push $IMAGE_TAG_1`
8. Build and push Backend image:
   - `docker build -t $IMAGE_TAG_2 -f Dockerfile.backend --platform linux/x86_64 .`
   - `docker push $IMAGE_TAG_2`
9. Build and push Middleware image:
   - `docker build -t $IMAGE_TAG_3 -f Dockerfile.middleware --platform linux/x86_64 .`
   - `docker push $IMAGE_TAG_3`

All container images except the UI service should be in the artifact registry. The UI service will be pushed after an endpoint URL from the server service is retrieved

### Deploying the Application in GKE

Generate Kubernetes files form Docker Compose Files by using [Kompose](https://kompose.io/).

1. Run `kompose convert -f docker-compose.yml` to generate service and deployment files.
2. Run `gcloud container clusters get-credentials bigdata-cluster --zone europe-west10`
3. Run one by one:
   - `kubectl apply -f zookeeper-deployment.yaml`
   - `kubectl apply -f zookeper-service.yaml`
   - `kubectl apply -f kafka-deployment.yaml`
   - `kubectl apply -f kafka-service.yaml`
   - `kubectl apply -f backend-deployment.yaml`
   - `kubectl apply -f backend-service.yaml`
   - `kubectl apply -f middleware-service.yaml`
   - `kubectl apply -f middleware-deployment.yaml`
4. Alter endpoint on frontend with the middleware endpoint on Google Could Console
5. Build and push the Frontend image:
   - `export IMAGE_TAG_4=europe-west10-docker.pkg.dev/gcloud_projectid/repository-name/frontend`
   - `docker build -t $IMAGE_TAG_4 -f Dockerfile.frontend --platform linux/x86_64 .`
   - `docker push $IMAGE_TAG_4`
6. Deploy the UI service:
   - `kubectl apply -f frontend-deployment.yaml`
   - `kubectl apply -f frontend-service.yaml`

Deployment to the cloud is now finished.

## Authors

This project is developed by Group M3:

- [Learta Januzi](learta.januzi@tuhh.de)
- [Akshayanivashini Chandrasekar Vijayalakshmi](akshayanivashini.chandrasekar.vijayalakshmi@tuhh.de)
- [Ananya Lakshmanan](krishnan.krishnan.lakshmanan.ananya@tuhh.de)
- [Chindhuja Paramesh](Chindhuja.Paramesh@tuhh.de)
