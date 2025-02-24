package com.repomanager.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class QueueMessage {
    private String event;
    private String message;
    private String timestamp;
    private Repository repository;
    private String sender;
    private String action;

    // Getters and Setters
    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    
    public Repository getRepository() { return repository; }
    public void setRepository(Repository repository) { this.repository = repository; }
    
    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }
    
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    @Override
    public String toString() {
        return String.format(
            "QueueMessage{event='%s', message='%s', timestamp='%s', repository=%s, sender='%s', action='%s'}",
            event, message, timestamp, repository, sender, action);
    }
}
