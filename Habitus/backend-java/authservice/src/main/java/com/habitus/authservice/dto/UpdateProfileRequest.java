package com.habitus.authservice.dto;

public class UpdateProfileRequest {
    private String name;
    private String timezone;
    private String avatarUrl;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String name, String timezone, String avatarUrl) {
        this.name = name;
        this.timezone = timezone;
        this.avatarUrl = avatarUrl;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
