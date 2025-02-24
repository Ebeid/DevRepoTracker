package com.repomanager;

import com.repomanager.model.QueueMessage;
import com.repomanager.model.Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MessageProcessor {
    private static final Logger logger = LoggerFactory.getLogger(MessageProcessor.class);

    public void process(QueueMessage message) {
        Repository repository = message.getRepository();
        
        switch (message.getEvent()) {
            case "repository_added" -> processRepositoryAdded(message, repository);
            case "push" -> processPushEvent(message, repository);
            case "pull_request" -> processPullRequest(message, repository);
            default -> logger.warn("Unhandled event type: {}", message.getEvent());
        }
    }

    // Override these methods to add custom processing logic
    protected void processRepositoryAdded(QueueMessage message, Repository repository) {
        logger.info("New repository added: {}", repository);
        logger.info("Message details: {}", message.getMessage());
        // Add your custom processing logic here
    }

    protected void processPushEvent(QueueMessage message, Repository repository) {
        logger.info("Push event received for repository: {}", repository.getFullName());
        logger.info("Sender: {}", message.getSender());
        logger.info("Message: {}", message.getMessage());
        // Add your custom processing logic here
    }

    protected void processPullRequest(QueueMessage message, Repository repository) {
        logger.info("Pull request event for repository: {}", repository.getFullName());
        logger.info("Action: {}", message.getAction());
        logger.info("Sender: {}", message.getSender());
        logger.info("Message: {}", message.getMessage());
        // Add your custom processing logic here
    }
}
