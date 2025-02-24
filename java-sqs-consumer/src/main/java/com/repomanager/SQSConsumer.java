package com.repomanager;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sqs.SqsClient;
import software.amazon.awssdk.services.sqs.model.*;
import com.repomanager.model.QueueMessage;

import java.time.Duration;
import java.util.List;

public class SQSConsumer {
    private static final Logger logger = LoggerFactory.getLogger(SQSConsumer.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private final SqsClient sqsClient;
    private final String queueUrl;
    private final MessageProcessor messageProcessor;

    public SQSConsumer() {
        // Get configuration from environment variables
        String region = System.getenv("AWS_REGION");
        this.queueUrl = System.getenv("AWS_QUEUE_URL");

        if (queueUrl == null || queueUrl.isEmpty()) {
            throw new IllegalStateException("AWS_QUEUE_URL environment variable must be set");
        }

        // Initialize AWS SQS client
        this.sqsClient = SqsClient.builder()
            .region(Region.of(region))
            .credentialsProvider(EnvironmentVariableCredentialsProvider.create())
            .build();
            
        // Initialize message processor
        this.messageProcessor = new MessageProcessor();
    }

    public void startConsuming() {
        logger.info("Starting SQS consumer...");
        
        while (true) {
            try {
                // Receive messages from the queue
                ReceiveMessageRequest receiveRequest = ReceiveMessageRequest.builder()
                    .queueUrl(queueUrl)
                    .maxNumberOfMessages(10)
                    .waitTimeSeconds(20)
                    .build();

                List<Message> messages = sqsClient.receiveMessage(receiveRequest).messages();
                
                for (Message message : messages) {
                    try {
                        processMessage(message);
                        deleteMessage(message);
                    } catch (Exception e) {
                        logger.error("Error processing message: " + message.messageId(), e);
                    }
                }
            } catch (Exception e) {
                logger.error("Error receiving messages", e);
                // Wait before retrying
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        }
    }

    private void processMessage(Message message) throws Exception {
        String messageBody = message.body();
        QueueMessage queueMessage = objectMapper.readValue(messageBody, QueueMessage.class);
        
        // Log full message content
        logger.info("Processing message: {}", queueMessage);
        
        // Process based on event type
        messageProcessor.process(queueMessage);
    }

    private void deleteMessage(Message message) {
        try {
            DeleteMessageRequest deleteRequest = DeleteMessageRequest.builder()
                .queueUrl(queueUrl)
                .receiptHandle(message.receiptHandle())
                .build();
            
            sqsClient.deleteMessage(deleteRequest);
            logger.info("Successfully deleted message: {}", message.messageId());
        } catch (Exception e) {
            logger.error("Error deleting message: " + message.messageId(), e);
        }
    }

    public static void main(String[] args) {
        SQSConsumer consumer = new SQSConsumer();
        consumer.startConsuming();
    }
}
