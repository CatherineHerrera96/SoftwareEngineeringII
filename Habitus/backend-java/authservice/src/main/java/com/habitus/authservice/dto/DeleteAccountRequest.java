package com.habitus.authservice.dto;

public class DeleteAccountRequest {
    private String currentPassword;

    public DeleteAccountRequest() {
    }

    public DeleteAccountRequest(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }
}
