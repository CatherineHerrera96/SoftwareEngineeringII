package com.habitus.authservice.service;

import org.springframework.stereotype.Service;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender emailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public EmailService(JavaMailSender emailSender) {
        this.emailSender = emailSender;
        log.info("EmailService initialized");
    }

    public void sendSimpleMessage(String to, String subject, String text) {
        log.info("Preparing to send email:");
        log.info("  From: Habitus <{}>", fromEmail);
        log.info("  To: {}", to);
        log.info("  Subject: {}", subject);

        MimeMessage message = emailSender.createMimeMessage();

        try {
            MimeMessageHelper helper = new MimeMessageHelper(message);
            helper.setFrom(fromEmail, "Habitus");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(text, true); // true = html

            log.info("Email message prepared, attempting to send via SMTP...");
            emailSender.send(message);
            log.info("✓ Email sent successfully to {}", to);

        } catch (MessagingException e) {
            log.error("✗ MessagingException while preparing email:");
            log.error("  Error: {}", e.getMessage());
            throw new RuntimeException("Failed to send email to " + to, e);
        } catch (Exception e) {
            log.error("✗ Unexpected exception while sending email:");
            log.error("  Type: {}", e.getClass().getName());
            log.error("  Message: {}", e.getMessage());
            throw new RuntimeException("Failed to send email to " + to, e);
        }
    }
}
