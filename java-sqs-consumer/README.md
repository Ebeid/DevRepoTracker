# SQS Consumer Microservice

A Java-based microservice that consumes messages from an AWS SQS queue. This service processes repository events and can be customized for different use cases.

## Prerequisites
- Docker and Docker Compose
- AWS credentials with SQS access

## Configuration
Copy the example environment file and update with your AWS credentials:
```bash
cp .env.example .env
# Edit .env with your AWS credentials
```

## Building and Running

### Using Docker Compose (Recommended)
```bash
docker-compose up --build
```

### Using Docker directly
```bash
# Build the image
docker build -t sqs-consumer .

# Run the container
docker run -d \
  --env-file .env \
  --name sqs-consumer \
  sqs-consumer
```

## Customizing Message Processing

To customize how messages are processed, modify the `MessageProcessor.java` class. The main processing logic is organized by event type:

1. Repository Added Events (`processRepositoryAdded`)
2. Push Events (`processPushEvent`)
3. Pull Request Events (`processPullRequest`)

Example customization:
```java
protected void processRepositoryAdded(QueueMessage message, Repository repository) {
    // Add your custom processing logic here
    logger.info("Processing repository: {}", repository.getName());
    // Example: Call external service, update database, etc.
}
```

## Monitoring
- View logs: `docker-compose logs -f`
- Check container status: `docker-compose ps`

## Troubleshooting
- If the consumer isn't receiving messages, verify your AWS credentials and queue URL
- Check logs for detailed error messages: `docker-compose logs sqs-consumer`
- Ensure your AWS IAM user has the required SQS permissions
