# App Modernization with AWS Fargate(ECS) and MongoDB Atlas

## Introduction: 
This is a technical repo to demonstrate the application deployment using MongoDB Atlas and AWS Fargate.
This tutorial is intended for those who want to
1. Serverless Application Deployment for Production Environment
2. Production deployment to auto-scale, HA, and Security
3. Agile development of application modernization
4. Deployment of containerized application in AWS
5. Want to try out the AWS Fargate and MongoDB Atlas 

## [MongoDB Atlas](https://www.mongodb.com/atlas) 
MongoDB Atlas is an all-purpose database having features like Document Model, Geo-spatial, Time Series, hybrid deployment, and multi-cloud services.
It evolved as a "Developer Data Platform", intended to reduce the developer workload on the development and management of the database environment.
It also provides a free tier to test out the application/database features.


## [AWS Fargate](https://aws.amazon.com/fargate/)
AWS Fargate is a serverless, pay-as-you-go compute engine that lets you focus on building applications without managing servers. AWS Fargate is compatible with both Amazon Elastic Container Service (ECS) and Amazon Elastic Kubernetes Service (EKS).

## Architecture Diagram:

<img width="834" alt="image" src="https://user-images.githubusercontent.com/101570105/216386105-4145c902-3518-4dbc-ae09-1407114e25af.png">



## Step-by-Step Fargate Deployment:


## **Set up the MongoDB Atlas cluster**


Please follow the [link](https://www.mongodb.com/docs/atlas/tutorial/deploy-free-tier-cluster) to set up a free cluster in MongoDB Atlas



## **Configure the Network access **

Configure the database for [network security](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/) 


## **Setup Amazon ECS with AWS Fargate**

### Create a role with a custom trust policy and AmazonECSTaskExecutionRolePolicy 

Name the role: ecsTaskExecutionRole

Use this custom trust policy


	{
	  "Version": "2012-10-17",
	  "Statement": [
	    {
	      "Sid": "",
	      "Effect": "Allow",
	      "Principal": {
	        "Service": "ecs-tasks.amazonaws.com"
	      },
	      "Action": "sts:AssumeRole"
	    }
	  ]
	}


Additional Policies: AmazonECSTaskExecutionRolePolicy


### **Clone the GitHub repository**

	git clone https://github.com/mongodb-partners/MEANStack_with_Atlas_on_Fargate.git
	cd MEANStack_with_Atlas_on_Fargate/code/MEANSTACK/partner-meanstack-atlas-fargate

### **Create Additional files**

file: aws-client.yml

	x-elbv2:
	  mean-lb:
	    Listeners:
	      - Port: 8080
	        Protocol: HTTP
	        Targets:
	          - name: client:client
	            access: /
	    Services:
	      - name: client:client
	        port: 8080
	        protocol: HTTP
	        healthcheck: 8080:HTTP:/:200,201

  file: aws-server.yml

	  x-elbv2:
	  mean-lb:
	    Properties:
	      Scheme: internet-facing
	      Type: application
	    MacroParameters:
	      Ingress:
	        ExtSources:
	          - IPv4: 0.0.0.0/0
	            Name: ANY
	            Description: "ANY"
	    Listeners:
	      - Port: 5200
	        Protocol: HTTP
	        Targets:
	          - name: server:server
	            access: /
	    Services:
	      - name: server:server
	        port: 5200
	        protocol: HTTP
	        healthcheck: 5200:HTTP:/employees:200,201

  file: docker-compose-server.yml (update the VPC and Account ID)
  
	version: "3"
	
	x-aws-vpc: vpc-XXXXXXX
	x-aws-role: ecsTaskExecutionRole
	
	services:
	  server:
	    build: ./server
	    image: <account>.dkr.ecr.us-east-1.amazonaws.com/partner-meanstack-atlas-fargate-server
	    platform: linux/amd64
	    ports:
	      - 5200

       
### **Set up the Elastic Container Repository (ECR)**

Update the Account ID

	aws ecr get-login-password --region us-east-1| docker login --username AWS --password-stdin <account_id>.dkr.ecr.us-east-1.amazonaws.com
	
	sudo curl -L https://github.com/docker/compose/releases/download/v2.15.1/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
	
	sudo chmod +x /usr/local/bin/docker-compose
	
	aws ecr create-repository \
	--repository-name partner-meanstack-atlas-fargate-client \
	--image-scanning-configuration scanOnPush=true \
	--region us-east-1
	
	
	aws ecr create-repository \
	--repository-name partner-meanstack-atlas-fargate-server \
	--image-scanning-configuration scanOnPush=true \
	--region us-east-1
	
	
	python3 -m venv venv
	source venv/bin/activate
	python3 -m pip install ecs-composex
	python3 -m pip install ecr-scan-reporter

 ### **Update the environment file with the MongoDB Atlas cluster connection string**
Navigate to .env and update the connection URL to point to the cluster you have created earlier. 

 ### **Setup the server in ECS**

 Update the code with a bucket name
 
	docker context create partner-meanstack-atlas-fargate
	docker context use partner-meanstack-atlas-fargate
	docker-compose  -f docker-compose-server.yml build
	docker-compose  -f docker-compose-server.yml push
	ecs-compose-x up  -f docker-compose-server.yml -f aws-server.yml -n partner-meanstack-atlas-fargate -b <bucket>

 ### **Setup the Client server in ECS**
 
The previous steps have created a Load Balancer. Look up the LB DNS and update employee.service.ts to point to the DNS. Leave the port as is.

Update the docker-compose.yml with VPC and Account ID

Update the below code with a bucket name

	docker-compose  -f docker-compose.yml build
	docker-compose  -f docker-compose.yml push
	ecs-compose-x up -f docker-compose.yml -f docker-compose-server.yml -f aws-server.yml -f aws-client.yml -n partner-meanstack-atlas-fargate -b <bucket>


 ### **Test the MEAN stack application **
 
Test the application in the browser by loading the app by the DNS and with port 8080. You should get a page like below. 
Note: If it's the first time you won't have any existing records.

## Summary:

 Hope this provides the steps to successfully deploy the containerized application onto AWS Fargate. 

 Pls share your feedback/queries to partners@mongodb.com
